// Next.js instrumentation hook — runs once on server start. Validates env
// vars in production so a misconfigured deploy never silently runs.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getEnv } = await import('@/lib/env');
    getEnv();
  }
}
