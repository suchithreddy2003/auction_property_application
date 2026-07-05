'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function createServiceOrderAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const preferred = formData.get('preferredTime');
  const order = await prisma.serviceOrder.create({
    data: {
      userId: session.uid,
      listingId: (formData.get('listingId') as string) || null,
      serviceType: String(formData.get('serviceType') || 'OTHER'),
      preferredTime: preferred ? new Date(String(preferred)) : null,
      status: 'REQUESTED',
    },
  });

  const notes = String(formData.get('notes') || '').trim();
  if (notes) {
    await prisma.communicationLog.create({
      data: {
        userId: session.uid,
        listingId: (formData.get('listingId') as string) || null,
        channel: 'NOTE',
        summary: notes,
        createdById: session.uid,
      },
    });
  }

  await logAudit({
    actorId: session.uid,
    action: 'service.request',
    target: `serviceOrder:${order.id}`,
    after: { serviceType: order.serviceType },
  });

  redirect('/account');
}
