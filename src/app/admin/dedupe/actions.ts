'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function resolveDedupeAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const id = String(formData.get('flagId') || '');
  const resolution = String(formData.get('resolution') || '');
  const flag = await prisma.dedupeFlag.findUnique({ where: { id } });
  if (!flag) return;

  await prisma.dedupeFlag.update({
    where: { id },
    data: { resolved: true, resolution, resolvedAt: new Date() },
  });

  // If linked as re-auction, set parent reference (B → A)
  if (resolution === 're_auction') {
    await prisma.listing.update({
      where: { id: flag.listingBId },
      data: { parentListingId: flag.listingAId, status: 'RE_AUCTION' },
    });
  }
  // If duplicate, archive listing B's workflow
  if (resolution === 'duplicate') {
    const t = await prisma.workflowTask.findFirst({ where: { listingId: flag.listingBId } });
    if (t) {
      await prisma.workflowTask.update({ where: { id: t.id }, data: { state: 'ARCHIVED' } });
    }
  }

  await logAudit({
    actorId: session.uid,
    action: `dedupe.${resolution}`,
    target: `dedupeFlag:${id}`,
    after: { resolution },
  });

  revalidatePath('/admin/dedupe');
}
