import { describe, test, expect } from 'vitest';
import { can, isAdminRole, type Action } from '@/lib/rbac';
import type { Role } from '@/types/enums';

const ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE', 'BUYER'];

// Truth table from VALIDATION.md §3 G3 RBAC matrix
const matrix: Array<[Action, Role[]]> = [
  ['listing.create',       ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE']],
  ['listing.edit',         ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE']],
  ['listing.approve',      ['SUPER_ADMIN', 'MANAGER']],
  ['listing.publish',      ['SUPER_ADMIN', 'MANAGER']],
  ['listing.reject',       ['SUPER_ADMIN', 'MANAGER']],
  ['workflow.assignOthers',['SUPER_ADMIN', 'MANAGER']],
  ['workflow.assignSelf',  ['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE']],
  ['user.manage',          ['SUPER_ADMIN']],
  ['plan.manage',          ['SUPER_ADMIN']],
  ['promo.manage',         ['SUPER_ADMIN', 'MANAGER']],
  ['audit.viewFull',       ['SUPER_ADMIN']],
  ['audit.viewLimited',    ['SUPER_ADMIN', 'MANAGER']],
  ['audit.export',         ['SUPER_ADMIN']],
];

describe('rbac.can', () => {
  for (const [action, allowed] of matrix) {
    for (const role of ROLES) {
      const expected = allowed.includes(role);
      test(`${role} ${expected ? 'can' : 'cannot'} ${action}`, () => {
        const session = { uid: 'u', email: 'u@x.com', role };
        expect(can(session, action)).toBe(expected);
      });
    }
  }

  test('null session can never act', () => {
    expect(can(null, 'listing.create')).toBe(false);
    expect(can(null, 'audit.export')).toBe(false);
  });
});

describe('isAdminRole', () => {
  test('BUYER is not admin', () => expect(isAdminRole('BUYER')).toBe(false));
  test('EXECUTIVE is admin', () => expect(isAdminRole('EXECUTIVE')).toBe(true));
  test('MANAGER is admin', () => expect(isAdminRole('MANAGER')).toBe(true));
  test('SUPER_ADMIN is admin', () => expect(isAdminRole('SUPER_ADMIN')).toBe(true));
});
