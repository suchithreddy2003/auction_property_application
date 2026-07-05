import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Card, Badge, Button } from '@/components/ui';
import {
  toggleSavedSearchAction,
  deleteSavedSearchAction,
  cancelSubscriptionAction,
} from './searches/actions';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) return null;

  const [user, subs, savedSearches, alerts, serviceOrders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.uid } }),
    prisma.subscription.findMany({
      where: { userId: session.uid },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.savedSearch.findMany({
      where: { userId: session.uid },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.alert.findMany({
      where: { userId: session.uid },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.serviceOrder.findMany({
      where: { userId: session.uid },
      include: { listing: { select: { title: true, id: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const active = subs.find((s) => s.status === 'ACTIVE' && (!s.endsAt || s.endsAt > new Date()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{user?.name || 'Account'}</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
        <Link href="/account/profile">
          <Button variant="secondary" size="sm">Edit profile</Button>
        </Link>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Subscription</h2>
        {active ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{active.plan.name}</div>
              <div className="text-sm text-gray-600">
                Ends {active.endsAt ? active.endsAt.toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success">Active</Badge>
              <form action={cancelSubscriptionAction}>
                <input type="hidden" name="id" value={active.id} />
                <Button type="submit" variant="ghost" size="sm">Cancel</Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">No active subscription.</span>
            <Link href="/plans" className="text-sm text-brand-700 hover:underline">View plans →</Link>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Saved searches</h2>
          <Link href="/account/searches/new" className="text-sm text-brand-700 hover:underline">+ New</Link>
        </div>
        {savedSearches.length === 0 ? (
          <p className="text-sm text-gray-500">No saved searches yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {savedSearches.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.frequency} · {s.active ? 'Active' : 'Paused'}</div>
                </div>
                <div className="flex items-center gap-1">
                  <form action={toggleSavedSearchAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {s.active ? 'Pause' : 'Resume'}
                    </Button>
                  </form>
                  <form action={deleteSavedSearchAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm">Delete</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">No alerts sent yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>{a.channel} · {a.status}</span>
                <span className="text-xs text-gray-500">
                  {a.createdAt.toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Service requests</h2>
        {serviceOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No service requests yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {serviceOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{o.serviceType.replace('_', ' ')}</span>
                  {o.listing && <span className="text-gray-500"> · {o.listing.title}</span>}
                </span>
                <Badge>{o.status.replace('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
