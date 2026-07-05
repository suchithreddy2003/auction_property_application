import { describe, test, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  test('allows up to max then blocks', () => {
    const key = 'test-1-' + Math.random();
    for (let i = 0; i < 3; i++) {
      const r = rateLimit(key, { max: 3, windowSeconds: 60 });
      expect(r.allowed).toBe(true);
    }
    const denied = rateLimit(key, { max: 3, windowSeconds: 60 });
    expect(denied.allowed).toBe(false);
    expect(denied.resetIn).toBeGreaterThan(0);
  });

  test('different keys count independently', () => {
    const a = rateLimit('a-' + Math.random(), { max: 1, windowSeconds: 60 });
    const b = rateLimit('b-' + Math.random(), { max: 1, windowSeconds: 60 });
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });
});
