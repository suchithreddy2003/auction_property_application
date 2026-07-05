import { describe, test, expect } from 'vitest';
import { canTransition } from '@/lib/workflow';
import { WorkflowStates, type WorkflowState } from '@/types/enums';

const ALLOWED: Record<WorkflowState, WorkflowState[]> = {
  DISCOVERED:           ['DEDUPE_FLAGGED', 'ASSIGNED', 'ARCHIVED'],
  DEDUPE_FLAGGED:       ['ASSIGNED', 'ARCHIVED'],
  ASSIGNED:             ['IN_PROCESSING', 'ARCHIVED'],
  IN_PROCESSING:        ['SUBMITTED_FOR_REVIEW', 'ARCHIVED'],
  SUBMITTED_FOR_REVIEW: ['APPROVED_PUBLISHED', 'REJECTED'],
  REJECTED:             ['IN_PROCESSING', 'ARCHIVED'],
  APPROVED_PUBLISHED:   ['ARCHIVED'],
  ARCHIVED:             [],
};

describe('workflow.canTransition', () => {
  for (const from of WorkflowStates) {
    for (const to of WorkflowStates) {
      const expected = ALLOWED[from].includes(to);
      test(`${from} → ${to} ${expected ? 'allowed' : 'forbidden'}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }

  test('rejects unknown source', () => {
    expect(canTransition('NOT_A_STATE' as WorkflowState, 'ASSIGNED')).toBe(false);
  });
});
