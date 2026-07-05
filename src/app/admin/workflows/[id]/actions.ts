'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { transition } from '@/lib/workflow';
import { logAudit } from '@/lib/audit';
import { WorkflowStates, type WorkflowState } from '@/types/enums';

export async function transitionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const taskId = String(formData.get('taskId') || '');
  const to = String(formData.get('to') || '') as WorkflowState;
  if (!WorkflowStates.includes(to)) throw new Error('Invalid state');

  if (to === 'APPROVED_PUBLISHED' || to === 'REJECTED') {
    requirePermission(session, 'listing.approve');
  }
  await transition(taskId, to, session);
  revalidatePath('/admin/workflows');
  revalidatePath(`/admin/workflows/${taskId}`);
  revalidatePath('/listings');
}

export async function assignSelfAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  requirePermission(session, 'workflow.assignSelf');

  const taskId = String(formData.get('taskId') || '');
  const task = await prisma.workflowTask.findUnique({ where: { id: taskId } });
  if (!task) return;
  const before = { assigneeId: task.assigneeId, state: task.state };

  const newState =
    task.state === 'DISCOVERED' || task.state === 'DEDUPE_FLAGGED' ? 'ASSIGNED' : task.state;

  await prisma.workflowTask.update({
    where: { id: taskId },
    data: { assigneeId: session.uid, state: newState },
  });

  await logAudit({
    actorId: session.uid,
    action: 'workflow.assignSelf',
    target: `workflow:${taskId}`,
    before,
    after: { assigneeId: session.uid, state: newState },
  });
  revalidatePath(`/admin/workflows/${taskId}`);
}
