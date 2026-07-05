import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { Card } from '@/components/ui';

export default async function AdminAuditPage({ searchParams }: { searchParams: { actor?: string; action?: string } }) {
  const session = await getSession();
  if (!session || (!can(session, 'audit.viewFull') && !can(session, 'audit.viewLimited'))) {
    redirect('/admin');
  }

  // Manager: limited to 90 days
  const limited = !can(session, 'audit.viewFull');
  const where: any = {};
  if (limited) {
    where.createdAt = { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
  }
  if (searchParams.action) where.action = { contains: searchParams.action };
  if (searchParams.actor) where.actor = { email: { contains: searchParams.actor } };

  const rows = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Audit log</h1>
      <p className="text-sm text-gray-600">
        {limited ? 'Manager view: last 90 days only.' : 'Full history.'}
      </p>
      <form className="flex flex-wrap gap-2">
        <input
          name="actor"
          defaultValue={searchParams.actor ?? ''}
          placeholder="Actor email contains…"
          className="h-9 flex-1 rounded-md border border-gray-300 px-3 text-sm"
        />
        <input
          name="action"
          defaultValue={searchParams.action ?? ''}
          placeholder="Action contains… (e.g. listing.)"
          className="h-9 flex-1 rounded-md border border-gray-300 px-3 text-sm"
        />
        <button className="h-9 rounded-md bg-brand-600 px-4 text-sm text-white">Filter</button>
        {can(session, 'audit.export') && (
          <a
            href={`/api/admin/audit/export?actor=${encodeURIComponent(searchParams.actor ?? '')}&action=${encodeURIComponent(searchParams.action ?? '')}`}
            className="h-9 rounded-md border border-gray-300 px-4 text-sm leading-9 hover:bg-gray-50"
          >
            Export CSV
          </a>
        )}
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-xs text-gray-500">{r.createdAt.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2">{r.actor?.email ?? '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-6 text-center text-sm text-gray-500">No entries.</div>}
      </Card>
    </div>
  );
}
