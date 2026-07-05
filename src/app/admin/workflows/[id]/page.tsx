import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { Card, Badge, Button } from '@/components/ui';
import { transitionAction, assignSelfAction } from './actions';
import type { WorkflowState } from '@/types/enums';

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

const APPROVAL_STATES: WorkflowState[] = ['APPROVED_PUBLISHED', 'REJECTED'];

export default async function WorkflowDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return null;

  const task = await prisma.workflowTask.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      sourceNotice: { include: { source: true } },
      assignee: true,
    },
  });
  if (!task) notFound();

  const history = task.history ? safeParse(task.history) ?? [] : [];
  const currentState = task.state as WorkflowState;
  const nextStates = ALLOWED[currentState] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/workflows" className="text-sm text-brand-700 hover:underline">
            ← Workflow queue
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{task.listing?.title ?? 'Unlinked task'}</h1>
        </div>
        <Badge>{currentState.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Listing</h2>
          {task.listing ? (
            <dl className="space-y-2 text-sm">
              <Field label="Lender">{task.listing.lenderName}</Field>
              <Field label="Location">{task.listing.city}, {task.listing.state}</Field>
              <Field label="Reserve price">₹{task.listing.reservePrice.toLocaleString('en-IN')}</Field>
              <Field label="Published">{task.listing.published ? 'Yes' : 'No'}</Field>
              <Field label="Risk">
                {task.listing.riskScore != null ? `${task.listing.riskScore} (${task.listing.riskLabel})` : '—'}
              </Field>
              <Link href={`/admin/listings/${task.listing.id}`} className="text-sm text-brand-700 hover:underline">
                Edit listing →
              </Link>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No listing linked.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Source</h2>
          {task.sourceNotice ? (
            <dl className="space-y-2 text-sm">
              <Field label="Source">{task.sourceNotice.source.name}</Field>
              <Field label="Captured">{task.sourceNotice.capturedAt.toLocaleString('en-IN')}</Field>
              <Field label="Parse confidence">{task.sourceNotice.parseConfidence ?? '—'}</Field>
              {task.sourceNotice.url && (
                <Field label="URL"><span className="break-all text-xs">{task.sourceNotice.url}</span></Field>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Manual listing — no source notice.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actions</h2>
          {task.assignee ? (
            <span className="text-sm text-gray-600">
              Assigned to {task.assignee.name ?? task.assignee.email}
            </span>
          ) : can(session, 'workflow.assignSelf') ? (
            <form action={assignSelfAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <Button variant="secondary" size="sm">Assign to me</Button>
            </form>
          ) : null}
        </div>

        {nextStates.length === 0 ? (
          <p className="text-sm text-gray-500">No further transitions allowed from this state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextStates.map((s) => {
              const requireApproval = APPROVAL_STATES.includes(s);
              const ok = requireApproval ? can(session, 'listing.approve') : true;
              if (!ok) return null;
              return (
                <form key={s} action={transitionAction} className="inline-block">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="to" value={s} />
                  <Button
                    variant={s === 'APPROVED_PUBLISHED' ? 'primary' : s === 'REJECTED' ? 'danger' : 'secondary'}
                    size="sm"
                  >
                    → {s.replace(/_/g, ' ')}
                  </Button>
                </form>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No transitions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {history.map((h: any, i: number) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span>
                  <span className="font-mono text-xs">{h.from}</span>
                  <span className="mx-1">→</span>
                  <span className="font-mono text-xs">{h.to}</span>
                  {h.notes && <span className="ml-2 text-gray-600">— {h.notes}</span>}
                </span>
                <span className="whitespace-nowrap text-xs text-gray-500">
                  {new Date(h.at).toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase text-gray-500">{label}</dt>
      <dd className="ml-3 truncate text-right">{children}</dd>
    </div>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
