import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import { verifyCheckoutSignature, verifyWebhookSignature } from '@/lib/razorpay';
import { createHmac } from 'crypto';

const ORIG = process.env.RAZORPAY_KEY_SECRET;
const ORIG_WEBHOOK = process.env.RAZORPAY_WEBHOOK_SECRET;

beforeEach(() => {
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'wh_secret';
});

afterAll(() => {
  process.env.RAZORPAY_KEY_SECRET = ORIG;
  process.env.RAZORPAY_WEBHOOK_SECRET = ORIG_WEBHOOK;
});

describe('verifyCheckoutSignature', () => {
  test('accepts a correctly-signed payload', () => {
    const payload = 'order_abc|pay_def';
    const sig = createHmac('sha256', 'test_secret').update(payload).digest('hex');
    expect(verifyCheckoutSignature(payload, sig)).toBe(true);
  });
  test('rejects a wrong signature', () => {
    expect(verifyCheckoutSignature('order_abc|pay_def', 'wrong')).toBe(false);
  });
  test('returns false when secret missing', () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(verifyCheckoutSignature('a|b', 'whatever')).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  test('accepts correct signature over raw body', () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac('sha256', 'wh_secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });
  test('rejects tampered body', () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac('sha256', 'wh_secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body + '?', sig)).toBe(false);
  });
});
