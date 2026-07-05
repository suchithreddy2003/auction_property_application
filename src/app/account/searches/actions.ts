'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

async function ownedSearch(id: string, uid: string) {
  const s = await prisma.savedSearch.findUnique({ where: { id } });
  if (!s || s.userId !== uid) return null;
  return s;
}

export async function toggleSavedSearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const id = String(formData.get('id') || '');
  const s = await ownedSearch(id, session.uid);
  if (!s) return;
  await prisma.savedSearch.update({
    where: { id },
    data: { active: !s.active },
  });
  await logAudit({
    actorId: session.uid,
    action: s.active ? 'savedSearch.disable' : 'savedSearch.enable',
    target: `savedSearch:${id}`,
  });
  revalidatePath('/account');
}

export async function deleteSavedSearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const id = String(formData.get('id') || '');
  const s = await ownedSearch(id, session.uid);
  if (!s) return;
  await prisma.savedSearch.delete({ where: { id } });
  await logAudit({
    actorId: session.uid,
    action: 'savedSearch.delete',
    target: `savedSearch:${id}`,
  });
  revalidatePath('/account');
}

export async function cancelSubscriptionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const id = String(formData.get('id') || '');
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== session.uid) return;
  await prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
  await logAudit({
    actorId: session.uid,
    action: 'subscription.cancel',
    target: `subscription:${id}`,
  });
  revalidatePath('/account');
}
