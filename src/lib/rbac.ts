// RBAC permission matrix from requirements §2.2.
// Action grammar: <resource>.<verb>. Every Server Action / admin handler
// must call requirePermission(session, action) before mutating.

import type { Role } from '@/types/enums';
import type { Session } from '@/lib/auth';

export type Action =
  | 'listing.create'
  | 'listing.edit'
  | 'listing.approve'
  | 'listing.publish'
  | 'listing.reject'
  | 'workflow.assignOthers'
  | 'workflow.assignSelf'
  | 'user.manage'
  | 'plan.manage'
  | 'promo.manage'
  | 'audit.viewFull'
  | 'audit.viewLimited'
  | 'audit.export';

const matrix: Record<Action, Role[]> = {
  'listing.create':       ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE'],
  'listing.edit':         ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE'],
  'listing.approve':      ['SUPER_ADMIN', 'MANAGER'],
  'listing.publish':      ['SUPER_ADMIN', 'MANAGER'],
  'listing.reject':       ['SUPER_ADMIN', 'MANAGER'],
  'workflow.assignOthers':['SUPER_ADMIN', 'MANAGER'],
  'workflow.assignSelf':  ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE'],
  'user.manage':          ['SUPER_ADMIN'],
  'plan.manage':          ['SUPER_ADMIN'],
  'promo.manage':         ['SUPER_ADMIN', 'MANAGER'],
  'audit.viewFull':       ['SUPER_ADMIN'],
  'audit.viewLimited':    ['SUPER_ADMIN', 'MANAGER'],
  'audit.export':         ['SUPER_ADMIN'],
};

export function can(session: Session | null, action: Action): boolean {
  if (!session) return false;
  return matrix[action].includes(session.role);
}

export function requirePermission(session: Session | null, action: Action) {
  if (!can(session, action)) {
    const err = new Error(`Forbidden: ${action}`);
    (err as any).status = 403;
    throw err;
  }
}

export function isAdminRole(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'EXECUTIVE';
}
