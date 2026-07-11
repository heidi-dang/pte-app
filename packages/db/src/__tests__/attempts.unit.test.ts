// Unit tests for the attempts repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createAttemptsRepository } from '../repositories/attempts.js';
import { AttemptStatus, AttemptType } from '@prisma/client';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    diagnosticAttempt: {
      create: mock.fn(async (args: any) => ({ id: 'diag1', ...args })),
      findUnique: mock.fn(async () => null),
      findMany: mock.fn(async () => []),
      update: mock.fn(async (args: any) => ({ id: 'diag1', ...args })),
    },
    mockAttempt: {
      create: mock.fn(async (args: any) => ({ id: 'mock1', ...args })),
      findUnique: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'mock1', ...args })),
    },
    sectionAttempt: {
      create: mock.fn(async (args: any) => ({ id: 'sect1', ...args })),
      findUnique: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'sect1', ...args })),
    },
    attemptResponse: {
      upsert: mock.fn(async (args: any) => ({ id: 'resp1', ...args })),
      update: mock.fn(async (args: any) => ({ id: 'resp1', ...args })),
    },
    ...overrides,
  } as any;
}

describe('Attempts repository', () => {
  it('createDiagnosticAttempt creates attempt record', async () => {
    const db = makeMockDb();
    const repo = createAttemptsRepository(db);

    await repo.createDiagnosticAttempt('u1');

    const calls = (db.diagnosticAttempt.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { data: { userId: string } };
    assert.equal(args.data.userId, 'u1');
  });

  it('completeDiagnosticAttempt completes attempt record', async () => {
    const db = makeMockDb();
    const repo = createAttemptsRepository(db);

    await repo.completeDiagnosticAttempt('diag1');

    const calls = (db.diagnosticAttempt.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string };
      data: { status: AttemptStatus; completedAt: unknown };
    };
    assert.equal(args.where.id, 'diag1');
    assert.equal(args.data.status, AttemptStatus.COMPLETED);
    assert.ok(args.data.completedAt instanceof Date);
  });

  it('createMockAttempt sets server deadline', async () => {
    const db = makeMockDb();
    const repo = createAttemptsRepository(db);
    const deadline = new Date();

    await repo.createMockAttempt('u1', deadline);

    const calls = (db.mockAttempt.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { data: { userId: string; serverDeadline: Date } };
    assert.equal(args.data.userId, 'u1');
    assert.deepEqual(args.data.serverDeadline, deadline);
  });

  it('submitMockResponse performs idempotent upsert', async () => {
    const db = makeMockDb();
    const repo = createAttemptsRepository(db);

    await repo.submitMockResponse('mock1', {
      questionVersionId: 'qv1',
      responseData: { answer: 'A' },
      durationMs: 12000,
    });

    const calls = (db.attemptResponse.upsert as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { mockAttemptId_questionVersionId: { mockAttemptId: string; questionVersionId: string } };
      create: { attemptType: AttemptType; mockAttemptId: string; questionVersionId: string; responseData: unknown };
    };
    assert.equal(args.where.mockAttemptId_questionVersionId.mockAttemptId, 'mock1');
    assert.equal(args.where.mockAttemptId_questionVersionId.questionVersionId, 'qv1');
    assert.equal(args.create.attemptType, AttemptType.MOCK);
    assert.equal(args.create.mockAttemptId, 'mock1');
    assert.equal(args.create.questionVersionId, 'qv1');
  });

  it('incrementAudioPlayback increments the playback counter', async () => {
    const db = makeMockDb();
    const repo = createAttemptsRepository(db);

    await repo.incrementAudioPlayback('resp1');

    const calls = (db.attemptResponse.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string };
      data: { audioPlaybackCount: { increment: number } };
    };
    assert.equal(args.where.id, 'resp1');
    assert.equal(args.data.audioPlaybackCount.increment, 1);
  });
});
