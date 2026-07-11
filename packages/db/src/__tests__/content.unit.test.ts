// Unit tests for the content repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createContentRepository } from '../repositories/content.js';
import { QuestionStatus, ReviewOutcome } from '@prisma/client';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const transactionFn = mock.fn(async (callback: (tx: any) => Promise<any>) => {
    return callback({
      question: {
        create: mock.fn(async (args: any) => ({ id: 'q1', ...args })),
      },
      questionVersion: {
        findFirst: mock.fn(async () => null),
        create: mock.fn(async (args: any) => ({ id: 'qv1', ...args })),
        update: mock.fn(async (args: any) => ({ id: 'qv1', ...args })),
      },
      questionReview: {
        create: mock.fn(async (args: any) => ({ id: 'qr1', ...args })),
      },
    });
  });

  return {
    $transaction: transactionFn,
    questionVersion: {
      update: mock.fn(async (args: any) => ({ id: 'qv1', ...args })),
      findMany: mock.fn(async () => []),
      findFirst: mock.fn(async () => null),
      count: mock.fn(async () => 0),
    },
    ...overrides,
  } as any;
}

describe('Content repository', () => {
  it('createQuestionDraft creates question and first version draft atomically', async () => {
    const db = makeMockDb();
    const repo = createContentRepository(db);

    await repo.createQuestionDraft({
      taskType: 'READ_ALOUD',
      promptText: 'Hello world',
      answerData: { expected: 'hello world' },
      metadata: {},
      authorId: 'u1',
    });

    const txCalls = (db.$transaction as any).mock.calls;
    assert.equal(txCalls.length, 1);
  });

  it('submitForReview transitions draft status to SUBMITTED_FOR_REVIEW', async () => {
    const db = makeMockDb();
    const repo = createContentRepository(db);

    await repo.submitForReview('qv1');

    const calls = (db.questionVersion.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string; status: QuestionStatus };
      data: { status: QuestionStatus };
    };
    assert.equal(args.where.id, 'qv1');
    assert.equal(args.where.status, QuestionStatus.DRAFT);
    assert.equal(args.data.status, QuestionStatus.SUBMITTED_FOR_REVIEW);
  });

  it('publishQuestionVersion transitions approved version status to PUBLISHED', async () => {
    const db = makeMockDb();
    const repo = createContentRepository(db);

    await repo.publishQuestionVersion('qv1', 'admin1');

    const calls = (db.questionVersion.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string; status: QuestionStatus };
      data: { status: QuestionStatus; publishedAt: unknown };
    };
    assert.equal(args.where.id, 'qv1');
    assert.equal(args.where.status, QuestionStatus.APPROVED);
    assert.equal(args.data.status, QuestionStatus.PUBLISHED);
    assert.ok(args.data.publishedAt instanceof Date);
  });

  it('retireQuestionVersion transitions published version status to RETIRED', async () => {
    const db = makeMockDb();
    const repo = createContentRepository(db);

    await repo.retireQuestionVersion('qv1');

    const calls = (db.questionVersion.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string; status: QuestionStatus };
      data: { status: QuestionStatus; retiredAt: unknown };
    };
    assert.equal(args.where.id, 'qv1');
    assert.equal(args.where.status, QuestionStatus.PUBLISHED);
    assert.equal(args.data.status, QuestionStatus.RETIRED);
    assert.ok(args.data.retiredAt instanceof Date);
  });
});
