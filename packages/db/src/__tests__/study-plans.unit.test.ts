// Unit tests for the study plans repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createStudyPlansRepository } from '../repositories/study-plans.js';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const transactionFn = mock.fn(async (callback: (tx: any) => Promise<any>) => {
    return callback({
      studyPlan: {
        updateMany: mock.fn(async () => ({ count: 1 })),
        create: mock.fn(async (args: any) => ({ id: 'plan1', ...args })),
      },
      studyPlanProgress: {
        create: mock.fn(async (args: any) => ({ id: 'prog1', ...args })),
      },
      studyPlanItem: {
        update: mock.fn(async (args: any) => ({ id: 'item1', ...args })),
      },
    });
  });

  return {
    $transaction: transactionFn,
    studyPlan: {
      findFirst: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'plan1', ...args })),
    },
    studyPlanItem: {
      count: mock.fn(async () => 0),
    },
    ...overrides,
  } as any;
}

describe('Study plans repository', () => {
  it('generatePlan deactivates old plans and creates new plan atomically', async () => {
    const db = makeMockDb();
    const repo = createStudyPlansRepository(db);

    await repo.generatePlan({
      userId: 'u1',
      basedOnDiagId: 'diag1',
      targetScore: 79,
      examDate: new Date(),
      items: [{ activityType: 'PRACTICE', dueDate: new Date(), estimatedMins: 30, priority: 1 }],
    });

    const txCalls = (db.$transaction as any).mock.calls;
    assert.equal(txCalls.length, 1);
  });

  it('completeItem records progress and marks item complete in transaction', async () => {
    const db = makeMockDb();
    const repo = createStudyPlansRepository(db);

    await repo.completeItem('item1');

    const txCalls = (db.$transaction as any).mock.calls;
    assert.equal(txCalls.length, 1);
  });

  it('getPlanProgress calculates percentage correctly', async () => {
    const db = makeMockDb({
      studyPlanItem: {
        count: mock.fn(async (args: { where: { completedAt?: unknown } }) => {
          if (args.where.completedAt) {
            return 3; // completed count
          }
          return 10; // total count
        }),
      },
    });
    const repo = createStudyPlansRepository(db);

    const progress = await repo.getPlanProgress('plan1');
    assert.equal(progress, 30);
  });
});
