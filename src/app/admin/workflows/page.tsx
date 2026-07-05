import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, Badge } from '@/components/ui';
import { WorkflowStates } from '@/types/enums';

export default async function WorkflowsPage({ searchParams }: { searchParams: { state?: string } }) {
  const state = (searchParams.state || '').toUpperCase();
  const where = WorkflowStates.includes(state as any) ? { state } : {};

  const tasks = await prisma.workflowTask.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: 100,
    include: {
      listing: { select: { id: true, title: true, lenderName: true, city: true, state: true } },
      assignee: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workflow queue</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/workflows"
          className={`rounded-full border px-3 py-1 text-xs ${!state ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
        >
          All
        </Link>
        {WorkflowStates.map((s) => (
          <Link
            key={s}
            href={`/admin/workflows?state=${s}`}
            className={`rounded-full border px-3 py-1 text-xs ${state === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No tasks in this state.</Card>
      ) : (
        <Card className="divide-y divide-gray-100">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/admin/workflows/${t.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="font-medium">{t.listing?.title ?? '(no listing)'}</div>
                <div className="text-xs text-gray-500">
                  {t.listing?.lenderName} · {t.listing?.city}, {t.listing?.state}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Badge>{t.state.replace(/_/g, ' ')}</Badge>
                {t.assignee && <span className="text-gray-500">{t.assignee.name ?? t.assignee.email}</span>}
                <span className="text-gray-400">{t.createdAt.toLocaleDateString('en-IN')}</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
