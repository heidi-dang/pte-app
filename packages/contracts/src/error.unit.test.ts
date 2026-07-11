import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAppError } from './error.js';

describe('Error contract', () => {
  it('isAppError returns true for valid error', () => {
    const err = { code: 'NOT_FOUND', message: 'User not found' };
    assert.ok(isAppError(err));
  });

  it('isAppError returns false for null', () => {
    assert.equal(isAppError(null), false);
  });

  it('isAppError returns false for missing message', () => {
    assert.equal(isAppError({ code: 'NOT_FOUND' }), false);
  });
});
