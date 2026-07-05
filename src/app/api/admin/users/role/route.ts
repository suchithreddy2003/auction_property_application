import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { Roles, type Role } from '@/types/enums';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  try {
    requirePermission(session, 'user.manage');
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }
  const userId = String(body.userId || '');
  const role = String(body.role || '');
  if (!Roles.includes(role as Role)) {
    return new NextResponse('Invalid role', { status: 400 });
  }
  if (!userId) return new NextResponse('Missing userId', { status: 400 });
  if (userId === session.uid) {
    return new NextResponse('Cannot change your own role', { status: 400 });
  }

  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) return new NextResponse('User not found', { status: 404 });

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  await logAudit({
    actorId: session.uid,
    action: 'user.role.change',
    target: `user:${userId}`,
    before: { role: before.role },
    after: { role },
  });
  return NextResponse.json({ ok: true });
}
