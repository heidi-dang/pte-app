// Unit tests for the scoring repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createScoringRepository } from '../repositories/scoring.js';
import { ScoringMethod, ScoringStatus } from '@prisma/client';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const transactionFn = mock.fn(async (callback: (tx: any) => Promise<any>) => {
    return callback({
      scoringResult: {
        update: mock.fn(async (args: any) => ({ id: 'res1', ...args })),
      },
      scoringResultComponent: {
        createMany: mock.fn(async (args: any) => ({ count: 1, ...args })),
      },
    });
  });

  return {
    $transaction: transactionFn,
    scoringResult: {
      create: mock.fn(async (args: any) => ({ id: 'res1', ...args })),
      update: mock.fn(async (args: any) => ({ id: 'res1', ...args })),
      findUnique: mock.fn(async () => null),
      findMany: mock.fn(async () => []),
    },
    scoringProfile: {
      findFirst: mock.fn(async () => null),
    },
    ...overrides,
  } as any;
}

describe('Scoring repository', () => {
  it('createPendingResult creates result in PENDING status', async () => {
    const db = makeMockDb();
    const repo = createScoringRepository(db);

    await repo.createPendingResult({
      scoringProfileId: 'prof1',
      scoringProfileVersion: '1.0.0',
      questionVersion: 'qv1_1',
      scoringMethod: ScoringMethod.AI_ESTIMATED,
      practiceResponseId: 'pr1',
    });

    const calls = (db.scoringResult.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { data: { status: ScoringStatus; scoringProfileId: string } };
    assert.equal(args.data.status, ScoringStatus.PENDING);
    assert.equal(args.data.scoringProfileId, 'prof1');
  });

  it('completeResult completes result and creates components inside transaction', async () => {
    const db = makeMockDb();
    const repo = createScoringRepository(db);

    await repo.completeResult({
      id: 'res1',
      estimatedScore: 78.5,
      confidenceLow: 75.0,
      confidenceHigh: 82.0,
      rawResponse: { raw: 'data' },
      components: [
        { criterion: 'pronunciation', score: 80, evidence: {} },
        { criterion: 'fluency', score: 77, evidence: {} },
      ],
    });

    const txCalls = (db.$transaction as any).mock.calls;
    assert.equal(txCalls.length, 1);
  });

  it('markFailed sets status to FAILED', async () => {
    const db = makeMockDb();
    const repo = createScoringRepository(db);

    await repo.markFailed('res1', 'Error message');

    const calls = (db.scoringResult.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { where: { id: string }; data: { status: ScoringStatus } };
    assert.equal(args.where.id, 'res1');
    assert.equal(args.data.status, ScoringStatus.FAILED);
  });
});
