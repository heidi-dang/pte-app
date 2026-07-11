import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { success, failure } from './api.js';

describe('API response contract', () => {
  it('success creates ok response', () => {
    const res = success({ id: '1' });
    assert.equal(res.ok, true);
    assert.equal(res.data.id, '1');
  });

  it('failure creates error response', () => {
    const res = failure({ code: 'NOT_FOUND', message: 'missing' });
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'NOT_FOUND');
  });
});
