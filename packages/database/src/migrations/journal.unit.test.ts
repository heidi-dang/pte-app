import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeChecksum, type Migration } from './journal.js';

describe('migration journal', () => {
  it('computes stable checksum for identical sql', () => {
    const sql = 'CREATE TABLE test (id INT);';
    assert.equal(computeChecksum(sql), computeChecksum(sql));
  });

  it('computes different checksums for different sql', () => {
    const a = computeChecksum('CREATE TABLE a (id INT);');
    const b = computeChecksum('CREATE TABLE b (id INT);');
    assert.notEqual(a, b);
  });

  it('checksum is deterministic', () => {
    const sql = 'SELECT 1;';
    assert.equal(computeChecksum(sql), computeChecksum(sql));
  });
});
