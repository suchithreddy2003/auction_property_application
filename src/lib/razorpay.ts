// Razorpay helpers — order creation and webhook signature verification.
// Falls back to a stubbed flow when keys are absent so dev works end-to-end.

import { createHmac, timingSafeEqual } from 'crypto';
import { razorpayEnabled } from '@/lib/env';

export type RazorpayOrder = {
  id: string;
  amount: number;       // in paise
  currency: string;
  receipt?: string;
  status: string;
  stubbed?: boolean;
};

export async function createOrder(args: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!razorpayEnabled()) {
    return {
      id: `order_stub_${Date.now()}`,
      amount: args.amountInPaise,
      currency: 'INR',
      receipt: args.receipt,
      status: 'created',
      stubbed: true,
    };
  }

  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: args.amountInPaise,
      currency: 'INR',
      receipt: args.receipt,
      notes: args.notes,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Razorpay create-order failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as RazorpayOrder;
  return data;
}

// Verifies the signature returned by Razorpay's checkout success callback.
// `payload` should be `${orderId}|${paymentId}`.
export function verifyCheckoutSignature(payload: string, signature: string): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return constantTimeEquals(expected, signature);
}

// Verifies the X-Razorpay-Signature header on webhook events.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return constantTimeEquals(expected, signature);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
