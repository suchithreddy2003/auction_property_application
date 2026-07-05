import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Manual ingestion endpoint (Phase 2 will be the crawler that POSTs here).
// Auth via x-ingest-key header (rotates with the secret).

const Body = z.object({
  sourceCode: z.string(),     // matches an existing Source row by name
  url: z.string().url().optional(),
  rawText: z.string().optional(),
  rawHtmlRef: z.string().optional(),
  parsedJson: z.record(z.unknown()).optional(),
  parseConfidence: z.number().min(0).max(1).optional(),
});

export async function POST(req: Request) {
  const key = req.headers.get('x-ingest-key');
  if (!key || key !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const source = await prisma.source.findFirst({ where: { name: data.sourceCode } });
  if (!source) return new NextResponse('Unknown source', { status: 404 });

  const notice = await prisma.sourceNotice.create({
    data: {
      sourceId: source.id,
      url: data.url ?? null,
      rawText: data.rawText ?? null,
      rawHtmlRef: data.rawHtmlRef ?? null,
      parsedJson: data.parsedJson ? JSON.stringify(data.parsedJson) : null,
      parseConfidence: data.parseConfidence ?? null,
    },
  });

  const task = await prisma.workflowTask.create({
    data: {
      sourceNoticeId: notice.id,
      state: 'DISCOVERED',
      slaHours: 24,
    },
  });

  return NextResponse.json({ ok: true, noticeId: notice.id, taskId: task.id });
}
