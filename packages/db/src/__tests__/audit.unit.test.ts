// Unit tests for the audit repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createAuditRepository } from '../repositories/audit.js';
import { AuditAction } from '@prisma/client';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    auditLog: {
      create: mock.fn(async (args: any) => ({ id: 'al1', ...args })),
      findMany: mock.fn(async () => []),
    },
    ...overrides,
  } as any;
}

describe('Audit repository', () => {
  it('append appends a new audit log record', async () => {
    const db = makeMockDb();
    const repo = createAuditRepository(db);

    await repo.append({
      userId: 'u1',
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: 'u1',
      ipAddress: '192.168.1.1',
    });

    const calls = (db.auditLog.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { data: { action: AuditAction; userId: string } };
    assert.equal(args.data.action, AuditAction.USER_LOGIN);
    assert.equal(args.data.userId, 'u1');
  });

  it('findForEntity queries using entityType and entityId', async () => {
    const db = makeMockDb();
    const repo = createAuditRepository(db);

    await repo.findForEntity('Question', 'q1');

    const calls = (db.auditLog.findMany as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { entityType: string; entityId: string };
      orderBy: { createdAt: string };
    };
    assert.equal(args.where.entityType, 'Question');
    assert.equal(args.where.entityId, 'q1');
    assert.equal(args.orderBy.createdAt, 'desc');
  });
});
