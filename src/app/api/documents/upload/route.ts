import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { newObjectKey, putObject } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { DocTypes, DocVisibilities } from '@/types/enums';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  try {
    requirePermission(session, 'listing.edit');
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const form = await req.formData();
  const listingId = String(form.get('listingId') || '');
  const docType = String(form.get('docType') || 'MISC');
  const visibility = String(form.get('visibility') || 'SUBSCRIBED');
  const file = form.get('file');

  if (!listingId) return new NextResponse('Missing listingId', { status: 400 });
  if (!DocTypes.includes(docType as any)) return new NextResponse('Bad docType', { status: 400 });
  if (!DocVisibilities.includes(visibility as any)) return new NextResponse('Bad visibility', { status: 400 });
  if (!(file instanceof File)) return new NextResponse('Missing file', { status: 400 });
  if (file.size === 0) return new NextResponse('Empty file', { status: 400 });
  if (file.size > MAX_BYTES) return new NextResponse('File too large (max 10 MB)', { status: 413 });
  if (!ALLOWED_MIME.has(file.type)) {
    return new NextResponse(`Unsupported file type: ${file.type}`, { status: 415 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return new NextResponse('Listing not found', { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const key = newObjectKey(`listings/${listingId}`, file.name);
  const uploaded = await putObject(key, buf, file.type);

  const doc = await prisma.document.create({
    data: {
      listingId,
      docType,
      visibility,
      storageKey: uploaded.key,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: uploaded.size,
    },
  });

  await logAudit({
    actorId: session.uid,
    action: 'document.upload',
    target: `document:${doc.id}`,
    after: { listingId, docType, visibility, size: uploaded.size },
  });

  return NextResponse.json({ ok: true, documentId: doc.id, key: uploaded.key });
}
