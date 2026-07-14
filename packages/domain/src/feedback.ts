import type { FeedbackContract, FeedbackType } from '@pte-app/contracts';
import type { FeedbackId, AttemptId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Feedback {
  readonly id: FeedbackId;
  readonly version: Version;
  readonly attemptId: AttemptId;
  readonly type: FeedbackType;
  readonly content: string;
  readonly criterion: string | null;
  readonly score: number | null;
  readonly generatedBy: string;
  readonly createdAt: ISO8601DateTime;
  readonly metadata: Record<string, unknown>;
}

export function createFeedback(contract: FeedbackContract): Feedback {
  return {
    id: contract.id,
    version: contract.version,
    attemptId: contract.attemptId,
    type: contract.type,
    content: contract.content,
    criterion: contract.criterion,
    score: contract.score,
    generatedBy: contract.generatedBy,
    createdAt: contract.createdAt,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function feedbackHasScore(feedback: Feedback): boolean {
  return feedback.score !== null;
}

export function feedbackIsScoring(feedback: Feedback): boolean {
  return feedback.type === 'scoring';
}
