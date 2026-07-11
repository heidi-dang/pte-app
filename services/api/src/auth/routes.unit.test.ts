import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password.js';
import { createToken, verifyToken } from './session.js';

describe('Password hashing', () => {
  it('hashes and verifies correctly', () => {
    const hash = hashPassword('testPassword123!');
    assert.ok(verifyPassword('testPassword123!', hash));
    assert.equal(verifyPassword('wrongPassword', hash), false);
  });

  it('produces different hashes each time', () => {
    const a = hashPassword('same');
    const b = hashPassword('same');
    assert.notEqual(a, b);
  });
});

describe('Session tokens', () => {
  it('creates and verifies valid tokens', () => {
    const payload = { userId: 'usr_test', role: 'student', sessionId: 'sess_test' };
    const token = createToken(payload);
    const result = verifyToken(token);
    assert.ok(result, 'Token should verify');
    assert.equal(result!.userId, 'usr_test');
    assert.equal(result!.role, 'student');
  });

  it('rejects malformed tokens', () => {
    const result = verifyToken('invalid-token');
    assert.equal(result, null);
  });
});
