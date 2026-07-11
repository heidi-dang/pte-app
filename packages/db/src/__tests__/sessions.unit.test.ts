// Unit tests for the sessions repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createSessionsRepository } from '../repositories/sessions.js';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    session: {
      create: mock.fn(async (args: any) => ({ id: 's1', ...args })),
      findFirst: mock.fn(async () => null),
      updateMany: mock.fn(async () => ({ count: 1 })),
      deleteMany: mock.fn(async () => ({ count: 1 })),
    },
    ...overrides,
  } as any;
}

describe('Sessions repository', () => {
  it('createSession stores session token', async () => {
    const db = makeMockDb();
    const repo = createSessionsRepository(db);
    const expiresAt = new Date(Date.now() + 3600_000);
    await repo.createSession({
      userId: 'u1',
      token: 'sess123',
      expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    const calls = (db.session.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const data = (calls[0]!.arguments[0] as { data: { token: string; userId: string; expiresAt: Date } }).data;
    assert.equal(data.token, 'sess123');
    assert.equal(data.userId, 'u1');
    assert.deepEqual(data.expiresAt, expiresAt);
  });

  it('invalidateSession updates invalidatedAt timestamp', async () => {
    const db = makeMockDb();
    const repo = createSessionsRepository(db);
    await repo.invalidateSession('sess123');
    const calls = (db.session.updateMany as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { where: { token: string }; data: { invalidatedAt: unknown } };
    assert.equal(args.where.token, 'sess123');
    assert.ok(args.data.invalidatedAt instanceof Date);
  });

  it('invalidateAllUserSessions updates all sessions for a user', async () => {
    const db = makeMockDb();
    const repo = createSessionsRepository(db);
    await repo.invalidateAllUserSessions('u1');
    const calls = (db.session.updateMany as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { userId: string; invalidatedAt: null };
      data: { invalidatedAt: unknown };
    };
    assert.equal(args.where.userId, 'u1');
    assert.equal(args.where.invalidatedAt, null);
    assert.ok(args.data.invalidatedAt instanceof Date);
  });

  it('pruneExpiredSessions deletes expired records', async () => {
    const db = makeMockDb();
    const repo = createSessionsRepository(db);
    const cutOff = new Date();
    await repo.pruneExpiredSessions(cutOff);
    const calls = (db.session.deleteMany as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { where: { expiresAt: { lt: Date } } };
    assert.deepEqual(args.where.expiresAt.lt, cutOff);
  });
});
