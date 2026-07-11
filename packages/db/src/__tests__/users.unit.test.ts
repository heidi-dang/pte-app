// Unit tests for the users repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createUsersRepository } from '../repositories/users.js';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      create: mock.fn(async (args: any) => ({ id: 'u1', ...args })),
      findUnique: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'u1', ...args.data })),
      findUniqueOrThrow: mock.fn(async () => ({
        id: 'u1',
        failedLoginCount: 3,
        lockedUntil: null,
      })),
    },
    userProfile: {
      upsert: mock.fn(async (args: any) => ({ id: 'p1', ...args })),
      update: mock.fn(async (args: any) => ({ id: 'p1', ...args.data })),
    },
    emailVerification: {
      create: mock.fn(async (args: any) => ({ id: 'ev1', ...args })),
      findFirst: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'ev1', ...args.data })),
    },
    ...overrides,
  } as any;
}

describe('Users repository', () => {
  it('createUser lowercases and trims email', async () => {
    const db = makeMockDb();
    const repo = createUsersRepository(db);
    await repo.createUser({ email: '  HELLO@Example.COM  ', passwordHash: 'hash' });
    const calls = (db.user.create as any).mock.calls;
    assert.equal(calls.length, 1);
    assert.equal((calls[0]!.arguments[0] as { data: { email: string } }).data.email, 'hello@example.com');
  });

  it('markEmailVerified sets emailVerified and emailVerifiedAt', async () => {
    const db = makeMockDb();
    const repo = createUsersRepository(db);
    await repo.markEmailVerified('u1');
    const calls = (db.user.update as any).mock.calls;
    const data = (calls[0]!.arguments[0] as { data: { emailVerified: boolean; emailVerifiedAt: unknown } }).data;
    assert.equal(data.emailVerified, true);
    assert.ok(data.emailVerifiedAt instanceof Date);
  });

  it('recordFailedLogin sets lockedUntil when threshold is met', async () => {
    const db = makeMockDb({
      user: {
        findUniqueOrThrow: mock.fn(async () => ({ id: 'u1', failedLoginCount: 4, lockedUntil: null })),
        update: mock.fn(async (args: any) => ({ id: 'u1', ...args.data })),
      },
    });
    const repo = createUsersRepository(db);
    await repo.recordFailedLogin('u1', 5, 60);
    const updateCalls = (db.user.update as any).mock.calls;
    const data = (updateCalls[0]!.arguments[0] as { data: { failedLoginCount: number; lockedUntil: unknown } }).data;
    assert.equal(data.failedLoginCount, 5);
    assert.ok(data.lockedUntil instanceof Date);
  });

  it('recordFailedLogin does not lock before threshold', async () => {
    const db = makeMockDb({
      user: {
        findUniqueOrThrow: mock.fn(async () => ({ id: 'u1', failedLoginCount: 2, lockedUntil: null })),
        update: mock.fn(async (args: any) => ({ id: 'u1', ...args.data })),
      },
    });
    const repo = createUsersRepository(db);
    await repo.recordFailedLogin('u1', 5, 60);
    const updateCalls = (db.user.update as any).mock.calls;
    const data = (updateCalls[0]!.arguments[0] as { data: { failedLoginCount: number; lockedUntil: unknown } }).data;
    assert.equal(data.failedLoginCount, 3);
    assert.equal(data.lockedUntil, undefined);
  });

  it('resetFailedLogins clears count and lockedUntil', async () => {
    const db = makeMockDb();
    const repo = createUsersRepository(db);
    await repo.resetFailedLogins('u1');
    const calls = (db.user.update as any).mock.calls;
    const data = (calls[0]!.arguments[0] as { data: { failedLoginCount: number; lockedUntil: null } }).data;
    assert.equal(data.failedLoginCount, 0);
    assert.equal(data.lockedUntil, null);
  });

  it('isLockedOut returns false when lockedUntil is null', async () => {
    const db = makeMockDb({
      user: {
        findUnique: mock.fn(async () => ({ id: 'u1', lockedUntil: null })),
      },
    });
    const repo = createUsersRepository(db);
    const locked = await repo.isLockedOut('u1');
    assert.equal(locked, false);
  });

  it('isLockedOut returns true when lockedUntil is in the future', async () => {
    const future = new Date(Date.now() + 60_000);
    const db = makeMockDb({
      user: {
        findUnique: mock.fn(async () => ({ id: 'u1', lockedUntil: future })),
      },
    });
    const repo = createUsersRepository(db);
    const locked = await repo.isLockedOut('u1');
    assert.equal(locked, true);
  });

  it('createEmailVerification stores the token and expiry', async () => {
    const db = makeMockDb();
    const repo = createUsersRepository(db);
    const expiresAt = new Date(Date.now() + 3600_000);
    await repo.createEmailVerification({ userId: 'u1', token: 'tok123', expiresAt });
    const calls = (db.emailVerification.create as any).mock.calls;
    const data = (calls[0]!.arguments[0] as { data: { token: string; expiresAt: Date } }).data;
    assert.equal(data.token, 'tok123');
    assert.deepEqual(data.expiresAt, expiresAt);
  });

  it('consumeVerification sets usedAt', async () => {
    const db = makeMockDb();
    const repo = createUsersRepository(db);
    await repo.consumeVerification('ev1');
    const calls = (db.emailVerification.update as any).mock.calls;
    const data = (calls[0]!.arguments[0] as { data: { usedAt: unknown } }).data;
    assert.ok(data.usedAt instanceof Date);
  });
});
