// Workflow state machine for §4.1.1.
// Every transition runs through transition() to enforce legality and
// append to history.

import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import type { WorkflowState } from '@/types/enums';
import type { Session } from '@/lib/auth';

const ALLOWED: Record<WorkflowState, WorkflowState[]> = {
  DISCOVERED:           ['DEDUPE_FLAGGED', 'ASSIGNED', 'ARCHIVED'],
  DEDUPE_FLAGGED:       ['ASSIGNED', 'ARCHIVED'],
  ASSIGNED:             ['IN_PROCESSING', 'ARCHIVED'],
  IN_PROCESSING:        ['SUBMITTED_FOR_REVIEW', 'ARCHIVED'],
  SUBMITTED_FOR_REVIEW: ['APPROVED_PUBLISHED', 'REJECTED'],
  REJECTED:             ['IN_PROCESSING', 'ARCHIVED'],
  APPROVED_PUBLISHED:   ['ARCHIVED'],
  ARCHIVED:             [],
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export async function transition(
  taskId: string,
  to: WorkflowState,
  actor: Session,
  opts?: { notes?: string }
) {
  const task = await prisma.workflowTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  const from = task.state as WorkflowState;
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition: ${from} → ${to}`);
  }

  const historyArr: Array<Record<string, unknown>> = task.history
    ? safeJSONParse(task.history) ?? []
    : [];
  historyArr.push({
    at: new Date().toISOString(),
    actor: actor.uid,
    from,
    to,
    notes: opts?.notes,
  });

  const updated = await prisma.workflowTask.update({
    where: { id: taskId },
    data: {
      state: to,
      history: JSON.stringify(historyArr),
      notes: opts?.notes ?? task.notes,
    },
  });

  // If publishing, flip the listing flag too
  if (to === 'APPROVED_PUBLISHED' && task.listingId) {
    await prisma.listing.update({
      where: { id: task.listingId },
      data: {
        published: true,
        publishedAt: new Date(),
        approvedById: actor.uid,
      },
    });
  }

  await logAudit({
    actorId: actor.uid,
    action: `workflow.transition.${to}`,
    target: `workflow:${taskId}`,
    before: { state: from },
    after: { state: to },
  });

  return updated;
}

function safeJSONParse(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}
