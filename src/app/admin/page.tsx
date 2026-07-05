import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, Badge } from '@/components/ui';

export default async function AdminDashboard() {
  const [
    totalListings,
    publishedListings,
    pendingReview,
    workflowByState,
    dedupePending,
    recentAudits,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { published: true } }),
    prisma.workflowTask.count({ where: { state: 'SUBMITTED_FOR_REVIEW' } }),
    prisma.workflowTask.groupBy({
      by: ['state'],
      _count: true,
    }),
    prisma.dedupeFlag.count({ where: { resolved: false } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { actor: { select: { email: true, role: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Operations dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total listings" value={totalListings} />
        <Stat label="Published" value={publishedListings} accent="success" />
        <Stat label="Awaiting review" value={pendingReview} accent="warning" />
        <Stat label="Open dedupe flags" value={dedupePending} accent={dedupePending > 0 ? 'danger' : 'default'} />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Workflow queue</h2>
        {workflowByState.length === 0 ? (
          <p className="text-sm text-gray-500">Queue is empty.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {workflowByState.map((row) => (
              <li key={row.state} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                <span className="font-medium">{row.state.replace(/_/g, ' ')}</span>
                <Badge>{row._count}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/workflows" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          Open queue →
        </Link>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent admin activity</h2>
        {recentAudits.length === 0 ? (
          <p className="text-sm text-gray-500">No audit entries yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {recentAudits.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-gray-500">
                    {a.actor?.email ?? 'system'} · {a.target}
                  </div>
                </div>
                <div className="whitespace-nowrap text-xs text-gray-500">
                  {a.createdAt.toLocaleString('en-IN')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, accent = 'default' }: { label: string; value: number; accent?: 'default' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    default: 'bg-white',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
  } as const;
  return (
    <Card className={`p-4 ${colors[accent]}`}>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </Card>
  );
}
