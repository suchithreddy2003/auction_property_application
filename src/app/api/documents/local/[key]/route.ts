import { NextResponse } from 'next/server';
import { readLocalObject, localObjectExists } from '@/lib/storage';
import { prisma } from '@/lib/db';

// Dev-only local file proxy. In production with R2 configured the signed-URL
// endpoint returns the direct R2 URL and this route is never reached.

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  if (process.env.NODE_ENV === 'production' && process.env.R2_BUCKET) {
    return new NextResponse('Not found', { status: 404 });
  }
  const key = decodeURIComponent(params.key);
  if (key.includes('..')) return new NextResponse('Bad request', { status: 400 });
  if (!(await localObjectExists(key))) return new NextResponse('Not found', { status: 404 });

  const doc = await prisma.document.findFirst({ where: { storageKey: key } });
  const { buf } = await readLocalObject(key);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': doc?.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${(doc?.fileName ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
