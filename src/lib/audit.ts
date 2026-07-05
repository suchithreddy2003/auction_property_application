import { prisma } from '@/lib/db';

export async function logAudit(args: {
  actorId?: string | null;
  action: string;
  target: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: args.actorId ?? null,
      action: args.action,
      target: args.target,
      before: args.before === undefined ? null : JSON.stringify(args.before),
      after: args.after === undefined ? null : JSON.stringify(args.after),
      ip: args.ip,
      userAgent: args.userAgent,
    },
  });
}
