import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// Cron-triggered: find workflow tasks past their SLA and bump priority.
// Tasks in terminal states (APPROVED_PUBLISHED, ARCHIVED, REJECTED) are skipped.

const TERMINAL = new Set(['APPROVED_PUBLISHED', 'ARCHIVED']);

async function handle(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const tasks = await prisma.workflowTask.findMany({
    where: {
      state: { notIn: ['APPROVED_PUBLISHED', 'ARCHIVED', 'REJECTED'] },
      priority: { lt: 100 },
    },
    take: 500,
  });

  let escalated = 0;
  for (const t of tasks) {
    const dueAt = t.dueAt ?? new Date(t.createdAt.getTime() + t.slaHours * 60 * 60 * 1000);
    if (dueAt > now) continue;
    if (TERMINAL.has(t.state)) continue;

    const newPriority = Math.min(100, (t.priority ?? 0) + 10);
    await prisma.workflowTask.update({
      where: { id: t.id },
      data: { priority: newPriority },
    });
    escalated++;
    await logAudit({
      actorId: null,
      action: 'workflow.sla.escalate',
      target: `workflow:${t.id}`,
      before: { priority: t.priority },
      after: { priority: newPriority, overdueBy: Math.round((now.getTime() - dueAt.getTime()) / 60000) + ' min' },
    });
  }

  return NextResponse.json({ ok: true, escalated });
}

export const GET = handle;
export const POST = handle;
