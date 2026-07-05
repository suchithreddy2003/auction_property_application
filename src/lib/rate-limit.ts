// Lightweight in-memory rate limiter. Good enough for single-instance
// Vercel deployments at MVP scale. For multi-region or sustained abuse,
// swap to a Redis/Upstash backend behind the same interface.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
};

export function rateLimit(
  key: string,
  opts: { max: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: opts.max - 1, resetIn: opts.windowSeconds };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.max - existing.count);
  const resetIn = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: existing.count <= opts.max,
    remaining,
    resetIn,
  };
}

// Periodic cleanup so the map doesn't grow unbounded. Only runs in long-lived
// processes; serverless cold starts reset everything anyway.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }, 60_000).unref?.();
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
