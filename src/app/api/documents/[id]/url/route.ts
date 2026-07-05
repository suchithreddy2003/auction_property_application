import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { viewerTier, canSeeDocument } from '@/lib/gating';
import { getSignedDownloadUrl } from '@/lib/storage';
import { isAdminRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { listing: { select: { id: true, published: true } } },
  });
  if (!doc) return new NextResponse('Not found', { status: 404 });

  const isAdmin = session && isAdminRole(session.role);
  if (!isAdmin) {
    if (!doc.listing.published) return new NextResponse('Not found', { status: 404 });
    const subscribed = session ? await hasActiveSubscription(session.uid) : false;
    const tier = await viewerTier(session, subscribed);
    if (!canSeeDocument(doc.visibility, tier)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const url = await getSignedDownloadUrl(doc.storageKey, 300);
  await logAudit({
    actorId: session?.uid ?? null,
    action: 'document.signed_url',
    target: `document:${doc.id}`,
  });
  return NextResponse.json({ url, expiresIn: 300 });
}
