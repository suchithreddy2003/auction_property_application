'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { computeRiskScore, type RiskInput } from '@/lib/risk-score';
import { findCandidates } from '@/lib/dedupe';
import { PropertyTypes, PossessionTypes, AuctionTypes, ListingStatuses } from '@/types/enums';

const ListingInput = z.object({
  title: z.string().min(3).max(200),
  propertyType: z.enum(PropertyTypes),
  auctionType: z.enum(AuctionTypes),
  possession: z.enum(PossessionTypes),
  status: z.enum(ListingStatuses),
  lenderName: z.string().min(1),
  branch: z.string().optional().nullable(),
  authorizedOfficer: z.string().optional().nullable(),
  borrowerName: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  locality: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().optional().nullable(),
  reservePrice: z.coerce.number().int().nonnegative(),
  emd: z.coerce.number().int().nonnegative().optional().nullable(),
  bidIncrement: z.coerce.number().int().nonnegative().optional().nullable(),
  isPremium: z.coerce.boolean().optional(),
  loanAvailable: z.coerce.boolean().optional(),

  // event fields (optional first event)
  auctionDateTime: z.string().optional().nullable(),
  emdLastDate: z.string().optional().nullable(),
  inspectionStart: z.string().optional().nullable(),
  inspectionEnd: z.string().optional().nullable(),
  venueOrPlatform: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),

  // risk inputs
  documentCompleteness: z.coerce.number().min(0).max(1).default(0.5),
  hasEncumbrance: z.coerce.boolean().optional(),
  hasLitigation: z.coerce.boolean().optional(),
  reauctionCount: z.coerce.number().int().min(0).default(0),
  sourceTrustTier: z.enum(['A', 'B', 'C', 'D']).default('B'),
});

function parseDt(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function asFormBoolean(fd: FormData, name: string): string {
  // HTML checkboxes only send the value when checked.
  return fd.get(name) ? 'true' : 'false';
}

function fdToObject(formData: FormData) {
  return {
    title: formData.get('title'),
    propertyType: formData.get('propertyType'),
    auctionType: formData.get('auctionType'),
    possession: formData.get('possession'),
    status: formData.get('status'),
    lenderName: formData.get('lenderName'),
    branch: formData.get('branch'),
    authorizedOfficer: formData.get('authorizedOfficer'),
    borrowerName: formData.get('borrowerName'),
    addressLine: formData.get('addressLine'),
    locality: formData.get('locality'),
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    reservePrice: formData.get('reservePrice'),
    emd: formData.get('emd') || null,
    bidIncrement: formData.get('bidIncrement') || null,
    isPremium: asFormBoolean(formData, 'isPremium'),
    loanAvailable: asFormBoolean(formData, 'loanAvailable'),
    auctionDateTime: formData.get('auctionDateTime'),
    emdLastDate: formData.get('emdLastDate'),
    inspectionStart: formData.get('inspectionStart'),
    inspectionEnd: formData.get('inspectionEnd'),
    venueOrPlatform: formData.get('venueOrPlatform'),
    contactPhone: formData.get('contactPhone'),
    contactEmail: formData.get('contactEmail'),
    documentCompleteness: formData.get('documentCompleteness'),
    hasEncumbrance: asFormBoolean(formData, 'hasEncumbrance'),
    hasLitigation: asFormBoolean(formData, 'hasLitigation'),
    reauctionCount: formData.get('reauctionCount') || 0,
    sourceTrustTier: formData.get('sourceTrustTier'),
  };
}

export async function createListingAction(prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  requirePermission(session, 'listing.create');

  const parsed = ListingInput.safeParse(fdToObject(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const d = parsed.data;

  const addressText = [d.addressLine, d.locality, d.city, d.state, d.pincode].filter(Boolean).join(' ');
  const riskInput: RiskInput = {
    possession: d.possession,
    documentCompleteness: d.documentCompleteness,
    hasEncumbranceMention: !!d.hasEncumbrance,
    hasLitigationMention: !!d.hasLitigation,
    reauctionCount: d.reauctionCount,
    sourceTrustTier: d.sourceTrustTier,
  };
  const risk = computeRiskScore(riskInput);

  const created = await prisma.listing.create({
    data: {
      title: d.title,
      propertyType: d.propertyType,
      auctionType: d.auctionType,
      possession: d.possession,
      status: d.status,
      lenderName: d.lenderName,
      branch: d.branch ?? null,
      authorizedOfficer: d.authorizedOfficer ?? null,
      borrowerName: d.borrowerName ?? null,
      addressLine: d.addressLine ?? null,
      locality: d.locality ?? null,
      city: d.city,
      state: d.state,
      pincode: d.pincode ?? null,
      addressText,
      reservePrice: d.reservePrice,
      emd: d.emd ?? null,
      bidIncrement: d.bidIncrement ?? null,
      isPremium: !!d.isPremium,
      loanAvailable: !!d.loanAvailable,
      documentCompleteness: d.documentCompleteness,
      hasEncumbrance: !!d.hasEncumbrance,
      hasLitigation: !!d.hasLitigation,
      reauctionCount: d.reauctionCount,
      sourceTrustTier: d.sourceTrustTier,
      riskScore: risk.score,
      riskLabel: risk.label,
      riskFactors: JSON.stringify(risk.factors),
    },
  });

  const auctionDt = parseDt(d.auctionDateTime);
  if (auctionDt) {
    await prisma.auctionEvent.create({
      data: {
        listingId: created.id,
        auctionDateTime: auctionDt,
        inspectionStart: parseDt(d.inspectionStart),
        inspectionEnd: parseDt(d.inspectionEnd),
        emdLastDate: parseDt(d.emdLastDate),
        venueOrPlatform: d.venueOrPlatform ?? null,
        contactPhone: d.contactPhone ?? null,
        contactEmail: d.contactEmail ?? null,
      },
    });
  }

  // Workflow task (manual creation starts at IN_PROCESSING)
  await prisma.workflowTask.create({
    data: {
      listingId: created.id,
      state: 'IN_PROCESSING',
      assigneeId: session.uid,
    },
  });

  // Dedupe check
  const candidates = await findCandidates({
    id: created.id,
    state: created.state,
    city: created.city,
    lenderName: created.lenderName,
    reservePrice: created.reservePrice,
    addressText: created.addressText,
    borrowerName: created.borrowerName,
  });
  for (const c of candidates) {
    const [a, b] = [created.id, c.otherId].sort();
    await prisma.dedupeFlag.upsert({
      where: { listingAId_listingBId: { listingAId: a, listingBId: b } },
      update: { similarity: c.similarity, reason: c.reasons.join(', ') },
      create: { listingAId: a, listingBId: b, similarity: c.similarity, reason: c.reasons.join(', ') },
    });
  }

  await logAudit({
    actorId: session.uid,
    action: 'listing.create',
    target: `listing:${created.id}`,
    after: { title: created.title, city: created.city },
  });

  revalidatePath('/admin/listings');
  redirect(`/admin/listings/${created.id}`);
}

export async function updateListingAction(prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  requirePermission(session, 'listing.edit');

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'Missing listing id' };

  const parsed = ListingInput.safeParse(fdToObject(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const d = parsed.data;
  const before = await prisma.listing.findUnique({ where: { id } });
  if (!before) return { error: 'Listing not found' };

  const addressText = [d.addressLine, d.locality, d.city, d.state, d.pincode].filter(Boolean).join(' ');
  const risk = computeRiskScore({
    possession: d.possession,
    documentCompleteness: d.documentCompleteness,
    hasEncumbranceMention: !!d.hasEncumbrance,
    hasLitigationMention: !!d.hasLitigation,
    reauctionCount: d.reauctionCount,
    sourceTrustTier: d.sourceTrustTier,
  });

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title: d.title,
      propertyType: d.propertyType,
      auctionType: d.auctionType,
      possession: d.possession,
      status: d.status,
      lenderName: d.lenderName,
      branch: d.branch ?? null,
      authorizedOfficer: d.authorizedOfficer ?? null,
      borrowerName: d.borrowerName ?? null,
      addressLine: d.addressLine ?? null,
      locality: d.locality ?? null,
      city: d.city,
      state: d.state,
      pincode: d.pincode ?? null,
      addressText,
      reservePrice: d.reservePrice,
      emd: d.emd ?? null,
      bidIncrement: d.bidIncrement ?? null,
      isPremium: !!d.isPremium,
      loanAvailable: !!d.loanAvailable,
      documentCompleteness: d.documentCompleteness,
      hasEncumbrance: !!d.hasEncumbrance,
      hasLitigation: !!d.hasLitigation,
      reauctionCount: d.reauctionCount,
      sourceTrustTier: d.sourceTrustTier,
      riskScore: risk.score,
      riskLabel: risk.label,
      riskFactors: JSON.stringify(risk.factors),
    },
  });

  // Update the linked auction event if any present
  const evDt = parseDt(d.auctionDateTime);
  if (evDt) {
    const existingEvent = await prisma.auctionEvent.findFirst({
      where: { listingId: id },
      orderBy: { auctionDateTime: 'asc' },
    });
    const eventData = {
      auctionDateTime: evDt,
      inspectionStart: parseDt(d.inspectionStart),
      inspectionEnd: parseDt(d.inspectionEnd),
      emdLastDate: parseDt(d.emdLastDate),
      venueOrPlatform: d.venueOrPlatform ?? null,
      contactPhone: d.contactPhone ?? null,
      contactEmail: d.contactEmail ?? null,
    };
    if (existingEvent) {
      await prisma.auctionEvent.update({ where: { id: existingEvent.id }, data: eventData });
    } else {
      await prisma.auctionEvent.create({ data: { listingId: id, ...eventData } });
    }
  }

  await logAudit({
    actorId: session.uid,
    action: 'listing.edit',
    target: `listing:${id}`,
    before: { title: before.title, status: before.status, published: before.published },
    after: { title: updated.title, status: updated.status, published: updated.published },
  });

  revalidatePath('/admin/listings');
  revalidatePath(`/admin/listings/${id}`);
  revalidatePath(`/listings/${id}`);
  return { error: undefined };
}

export async function deleteDocumentAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  requirePermission(session, 'listing.edit');

  const id = String(formData.get('id') || '');
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await prisma.document.delete({ where: { id } });
  await logAudit({
    actorId: session.uid,
    action: 'document.delete',
    target: `document:${id}`,
    before: { fileName: doc.fileName, listingId: doc.listingId },
  });
  revalidatePath(`/admin/listings/${doc.listingId}`);
  revalidatePath(`/listings/${doc.listingId}`);
}

export async function submitForReviewAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const id = String(formData.get('id') || '');
  const task = await prisma.workflowTask.findFirst({ where: { listingId: id } });
  if (!task) return;
  await prisma.workflowTask.update({
    where: { id: task.id },
    data: { state: 'SUBMITTED_FOR_REVIEW' },
  });
  await logAudit({
    actorId: session.uid,
    action: 'listing.submitForReview',
    target: `listing:${id}`,
  });
  revalidatePath(`/admin/workflows/${task.id}`);
  redirect(`/admin/workflows/${task.id}`);
}
