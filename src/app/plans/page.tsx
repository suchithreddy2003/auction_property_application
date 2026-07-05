import { prisma } from '@/lib/db';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const revalidate = 300;

export default async function PlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { enabled: true },
    orderBy: { priceInPaise: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Choose a plan</h1>
      <p className="text-gray-600">
        Cancel anytime. Subscribe to unlock exact addresses, bank contacts,
        full document downloads, and detailed risk breakdowns.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const ent = safeParse(p.entitlements) ?? {};
          const features = Array.isArray(ent.features) ? ent.features : [];
          return (
            <Card key={p.id} className="flex flex-col p-6">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <div className="my-3 text-3xl font-bold">
                ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                <span className="text-base font-normal text-gray-500"> / {p.durationDays} days</span>
              </div>
              <ul className="mb-5 flex-1 space-y-2 text-sm text-gray-700">
                {features.map((f: string) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/account/subscribe?plan=${p.code}`}>
                <Button className="w-full">Choose {p.name}</Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
