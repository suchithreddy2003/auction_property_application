'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { razorpayEnabled } from '@/lib/env';
import { createOrder, verifyCheckoutSignature } from '@/lib/razorpay';

// Demo mode — used when Razorpay isn't configured. Activates instantly.
export async function subscribeDemoAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const code = String(formData.get('planCode') || '');
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code } });
  if (!plan) redirect('/plans');

  if (razorpayEnabled()) {
    // Don't let demo activations slip through in production. Route to real flow.
    redirect(`/account/subscribe?plan=${plan.code}`);
  }

  const start = new Date();
  const end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.updateMany({
    where: { userId: session.uid, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId: session.uid,
      planId: plan.id,
      status: 'ACTIVE',
      startedAt: start,
      endsAt: end,
    },
  });

  await prisma.payment.create({
    data: {
      userId: session.uid,
      kind: 'SUBSCRIPTION',
      amountInPaise: plan.priceInPaise,
      status: 'PAID',
      gatewayRef: `demo_${sub.id}`,
      subscriptionId: sub.id,
    },
  });

  await logAudit({
    actorId: session.uid,
    action: 'subscription.activate.demo',
    target: `subscription:${sub.id}`,
    after: { plan: plan.code, endsAt: end },
  });

  redirect('/account');
}

// Razorpay order create — called from the subscribe page client-side checkout.
export async function createSubscriptionOrderAction(planCode: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
  if (!plan) throw new Error('Plan not found');

  const payment = await prisma.payment.create({
    data: {
      userId: session.uid,
      kind: 'SUBSCRIPTION',
      amountInPaise: plan.priceInPaise,
      status: 'CREATED',
      gatewayRef: null,
    },
  });

  const order = await createOrder({
    amountInPaise: plan.priceInPaise,
    receipt: `pay_${payment.id}`.slice(0, 40),
    notes: { userId: session.uid, planCode: plan.code, paymentId: payment.id },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayRef: order.id },
  });

  return {
    orderId: order.id,
    paymentId: payment.id,
    keyId: process.env.RAZORPAY_KEY_ID || '',
    amount: order.amount,
    currency: order.currency,
    planName: plan.name,
    stubbed: !!order.stubbed,
  };
}

// Called after Razorpay checkout returns success in the browser. Verifies
// the signature, marks the Payment paid, activates the Subscription.
export async function confirmSubscriptionPaymentAction(args: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planCode: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const payload = `${args.razorpay_order_id}|${args.razorpay_payment_id}`;
  if (!verifyCheckoutSignature(payload, args.razorpay_signature)) {
    throw new Error('Invalid payment signature');
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: args.planCode } });
  if (!plan) throw new Error('Plan not found');

  const payment = await prisma.payment.findFirst({
    where: { gatewayRef: args.razorpay_order_id, userId: session.uid },
  });
  if (!payment) throw new Error('Payment not found');

  const start = new Date();
  const end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.updateMany({
    where: { userId: session.uid, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId: session.uid,
      planId: plan.id,
      status: 'ACTIVE',
      startedAt: start,
      endsAt: end,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      subscriptionId: sub.id,
      gatewayRef: args.razorpay_payment_id,
    },
  });

  await logAudit({
    actorId: session.uid,
    action: 'subscription.activate',
    target: `subscription:${sub.id}`,
    after: { plan: plan.code, endsAt: end, gatewayRef: args.razorpay_payment_id },
  });

  return { ok: true };
}
