import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidTransition, VALID_ATTEMPT_TRANSITIONS } from '@pte-app/contracts';

describe('Phase I - State Machine Contract', () => {
  it('exports all expected statuses in transition map', () => {
    const expectedStatuses = ['created', 'in_progress', 'autosaved', 'submitted', 'reviewable', 'expired', 'interrupted', 'recovered'];
    for (const status of expectedStatuses) {
      assert.ok(status in VALID_ATTEMPT_TRANSITIONS, `Missing transition map entry for '${status}'`);
    }
  });

  it('no status transitions to itself (except reviewable)', () => {
    for (const [from, tos] of Object.entries(VALID_ATTEMPT_TRANSITIONS)) {
      for (const to of tos) {
        if (from === 'reviewable') continue; // reviewable has no transitions
        assert.notEqual(from, to, `Self-transition not allowed for '${from}' -> '${to}'`);
      }
    }
  });

  it('terminal states have no outgoing transitions', () => {
    assert.equal(VALID_ATTEMPT_TRANSITIONS['submitted'].length, 1);
    assert.equal(VALID_ATTEMPT_TRANSITIONS['submitted'][0], 'reviewable');
    assert.equal(VALID_ATTEMPT_TRANSITIONS['reviewable'].length, 0);
    assert.equal(VALID_ATTEMPT_TRANSITIONS['expired'].length, 0);
  });

  it('isValidTransition is symmetric with VALID_ATTEMPT_TRANSITIONS', () => {
    for (const [from, tos] of Object.entries(VALID_ATTEMPT_TRANSITIONS)) {
      for (const to of tos) {
        assert.ok(isValidTransition(from as any, to as any));
      }
    }
  });
});
