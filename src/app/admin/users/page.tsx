import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Card, Badge } from '@/components/ui';
import { RoleSelect } from './role-select';
import type { Role } from '@/types/enums';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN' && session?.role !== 'MANAGER') {
    redirect('/admin');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Users</h1>
      <Card className="divide-y divide-gray-100">
        {users.map((u) => {
          const sub = u.subscriptions[0];
          return (
            <div key={u.id} className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="font-medium">{u.name || u.email}</div>
                <div className="text-xs text-gray-500">{u.email} · {u.phone ?? 'no phone'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {session.role === 'SUPER_ADMIN' ? (
                  <RoleSelect userId={u.id} current={u.role as Role} disabled={u.id === session.uid} />
                ) : (
                  <Badge>{u.role.replace('_', ' ')}</Badge>
                )}
                {sub ? (
                  <Badge tone="success">{sub.plan.code}</Badge>
                ) : (
                  <Badge tone="default">No plan</Badge>
                )}
                <span className="text-xs text-gray-500">
                  Joined {u.createdAt.toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
