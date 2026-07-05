import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { logAudit } from '@/lib/audit';

// Razorpay sends webhook events for payment.captured, payment.failed, etc.
// We verify the signature, then idempotently upsert the Payment row state.
// The client-side confirm flow usually wins; this is a safety net for
// dropped client confirmations.

export async function POST(req: Request) {
  const sig = req.headers.get('x-razorpay-signature') || '';
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, sig)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let evt: any;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const eventName: string = evt.event;
  const orderId: string | undefined = evt.payload?.payment?.entity?.order_id;
  const paymentId: string | undefined = evt.payload?.payment?.entity?.id;
  const status: string | undefined = evt.payload?.payment?.entity?.status;
  const notes = evt.payload?.payment?.entity?.notes ?? {};

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const payment = await prisma.payment.findFirst({
    where: { gatewayRef: orderId },
  });
  if (!payment) {
    await prisma.payment.create({
      data: {
        userId: notes.userId ?? '',
        kind: 'SUBSCRIPTION',
        amountInPaise: evt.payload?.payment?.entity?.amount ?? 0,
        status: status === 'captured' ? 'PAID' : status === 'failed' ? 'FAILED' : 'CREATED',
        gatewayRef: paymentId ?? orderId,
        webhookLog: raw.slice(0, 4000),
      },
    });
    return NextResponse.json({ ok: true, created: true });
  }

  let newStatus = payment.status;
  if (eventName === 'payment.captured') newStatus = 'PAID';
  else if (eventName === 'payment.failed') newStatus = 'FAILED';
  else if (eventName === 'refund.created') newStatus = 'REFUNDED';

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      gatewayRef: paymentId ?? payment.gatewayRef,
      webhookLog: raw.slice(0, 4000),
    },
  });

  // If captured and we don't yet have a subscription, fulfill from notes
  if (newStatus === 'PAID' && !payment.subscriptionId && notes.planCode && payment.userId) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { code: notes.planCode } });
    if (plan) {
      const start = new Date();
      const end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      await prisma.subscription.updateMany({
        where: { userId: payment.userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });
      const sub = await prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startedAt: start,
          endsAt: end,
        },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: sub.id },
      });
      await logAudit({
        actorId: payment.userId,
        action: 'subscription.activate.webhook',
        target: `subscription:${sub.id}`,
        after: { plan: plan.code, endsAt: end },
      });
    }
  }

  await logAudit({
    actorId: null,
    action: `webhook.razorpay.${eventName}`,
    target: `payment:${payment.id}`,
    after: { status: newStatus },
  });

  return NextResponse.json({ ok: true });
}
