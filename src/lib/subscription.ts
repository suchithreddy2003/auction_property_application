import { prisma } from '@/lib/db';

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { id: true },
  });
  return !!sub;
}

export async function getActivePlanCode(userId: string): Promise<string | null> {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    include: { plan: true },
  });
  return sub?.plan.code ?? null;
}
