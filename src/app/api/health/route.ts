import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Returns 200 if the database is reachable; 503 otherwise. Use for uptime
// checks and load-balancer health probes.

export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: 'up',
      latencyMs: Date.now() - started,
      now: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: 'down',
        error: (err as Error).message,
      },
      { status: 503 }
    );
  }
}
