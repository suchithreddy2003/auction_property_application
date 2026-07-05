import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Card, Badge } from '@/components/ui';

export default async function AdminPlansPage() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') redirect('/admin');

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { priceInPaise: 'asc' },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Subscription plans</h1>
      <Card className="divide-y divide-gray-100">
        {plans.map((p) => {
          const ent = safeParse(p.entitlements) ?? {};
          return (
            <div key={p.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="font-medium">{p.name} <span className="text-xs text-gray-500">({p.code})</span></div>
                <div className="text-sm text-gray-600">
                  ₹{(p.priceInPaise / 100).toLocaleString('en-IN')} for {p.durationDays} days
                </div>
                {Array.isArray(ent.features) && (
                  <ul className="mt-1 text-xs text-gray-600">
                    {ent.features.map((f: string) => <li key={f}>· {f}</li>)}
                  </ul>
                )}
              </div>
              <Badge tone={p.enabled ? 'success' : 'default'}>{p.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          );
        })}
      </Card>
      <p className="text-xs text-gray-500">
        Plan editing UI is intentionally read-only in MVP. Edit via <code>npm run db:seed</code> or
        a future admin form.
      </p>
    </div>
  );
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return null; } }
