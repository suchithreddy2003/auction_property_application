import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { razorpayEnabled } from '@/lib/env';
import { Card } from '@/components/ui';
import { SubscribeForm } from './form';

export default async function SubscribePage({ searchParams }: { searchParams: { plan?: string } }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/account/subscribe');

  const code = searchParams.plan;
  const plan = code ? await prisma.subscriptionPlan.findUnique({ where: { code } }) : null;
  if (!plan) redirect('/plans');

  return (
    <div className="mx-auto max-w-md py-6">
      <Card className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">Confirm subscription</h1>
        <p className="mb-4 text-sm text-gray-600">
          {plan.name} — ₹{(plan.priceInPaise / 100).toLocaleString('en-IN')} for {plan.durationDays} days.
        </p>
        <SubscribeForm planCode={plan.code} planName={plan.name} usingRealPayments={razorpayEnabled()} />
      </Card>
    </div>
  );
}
