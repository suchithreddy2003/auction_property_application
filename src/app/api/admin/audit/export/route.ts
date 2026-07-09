import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';

export async function GET(req: Request) {
  const session = await getSession();
  if (!can(session, 'audit.export')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(req.url);
  const where: any = {};
  const action = url.searchParams.get('action');
  const actor = url.searchParams.get('actor');
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (actor) where.actor = { email: { contains: actor, mode: 'insensitive' } };

  const rows = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const csvLines = ['createdAt,actor,action,target,before,after'];
  for (const r of rows) {
    csvLines.push([
      r.createdAt.toISOString(),
      csvEscape(r.actor?.email ?? ''),
      csvEscape(r.action),
      csvEscape(r.target),
      csvEscape(r.before ?? ''),
      csvEscape(r.after ?? ''),
    ].join(','));
  }

  return new NextResponse(csvLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-${Date.now()}.csv"`,
    },
  });
}

function csvEscape(s: string) {
  if (!s) return '';
  const needsQuotes = /[,"\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}
