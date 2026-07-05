'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  subscribeDemoAction,
  createSubscriptionOrderAction,
  confirmSubscriptionPaymentAction,
} from './actions';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function SubscribeForm({
  planCode,
  planName,
  usingRealPayments,
}: {
  planCode: string;
  planName: string;
  usingRealPayments: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!usingRealPayments) {
    return (
      <>
        <p className="mb-4 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          Razorpay is not configured. Confirming here activates the plan
          immediately for demo purposes. Configure RAZORPAY_KEY_ID and
          RAZORPAY_KEY_SECRET to enable real payments.
        </p>
        <form action={subscribeDemoAction}>
          <input type="hidden" name="planCode" value={planCode} />
          <Button type="submit" className="w-full">Activate plan (demo)</Button>
        </form>
      </>
    );
  }

  async function pay() {
    setError(null);
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load Razorpay checkout.');

      const order = await createSubscriptionOrderAction(planCode);
      if (!order.keyId) throw new Error('Payment provider misconfigured.');

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Hanshitha Auctions',
          description: `Subscription — ${order.planName}`,
          order_id: order.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await confirmSubscriptionPaymentAction({
                ...response,
                planCode,
              });
              resolve();
              router.push('/account');
              router.refresh();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          theme: { color: '#3b4ea3' },
        });
        rzp.open();
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="mb-4 text-sm text-gray-600">
        Paying for: <strong>{planName}</strong>
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Button onClick={pay} disabled={loading} className="w-full">
        {loading ? 'Opening checkout…' : 'Pay with Razorpay'}
      </Button>
      <p className="mt-3 text-xs text-gray-500">
        You'll be redirected to Razorpay's secure checkout.
      </p>
    </>
  );
}
