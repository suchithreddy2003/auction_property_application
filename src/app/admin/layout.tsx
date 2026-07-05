import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/rbac';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/admin');
  if (!isAdminRole(session.role)) redirect('/');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <aside className="border-r border-gray-200 pr-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Admin · {session.role.replace('_', ' ')}
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin">Dashboard</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/workflows">Workflow queue</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/listings">Listings</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/listings/new">+ New listing</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/dedupe">Dedupe flags</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/users">Users</Link>
          {session.role === 'SUPER_ADMIN' && (
            <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/plans">Plans</Link>
          )}
          <Link className="rounded-md px-3 py-2 hover:bg-gray-100" href="/admin/audit">Audit log</Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
