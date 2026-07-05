// Environment validation. Imported at app startup via instrumentation.ts.
// In production, missing critical env vars fail loudly so a misconfigured
// deploy never silently falls back to dev defaults.

import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 chars'),
  CRON_SECRET: z.string().min(8, 'CRON_SECRET must be at least 8 chars'),

  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  ADMIN_SEED_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment misconfigured: ${msg}`);
    }
    console.warn(`[env] ${msg}`);
  }
  cached = (parsed.success ? parsed.data : (process.env as unknown as Env));
  return cached;
}

export function isProd() {
  return process.env.NODE_ENV === 'production';
}

export function emailEnabled() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function storageEnabled() {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

export function razorpayEnabled() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin)
  );
}
