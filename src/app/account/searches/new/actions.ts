'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function saveSearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const filter: Record<string, unknown> = {};
  for (const key of ['state', 'city', 'propertyType', 'minPrice', 'maxPrice']) {
    const v = formData.get(key);
    if (v != null && String(v).trim() !== '') filter[key] = String(v);
  }

  await prisma.savedSearch.create({
    data: {
      userId: session.uid,
      name: String(formData.get('name') || 'Untitled search'),
      filterJson: JSON.stringify(filter),
      channels: 'email',
      frequency: String(formData.get('frequency') || 'DAILY'),
      active: true,
    },
  });

  redirect('/account');
}
