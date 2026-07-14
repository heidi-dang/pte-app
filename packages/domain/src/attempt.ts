import type { AttemptContract, AttemptStatus, QuestionResponse } from '@pte-app/contracts';
import type { AttemptId, UserId, ExamId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Attempt {
  readonly id: AttemptId;
  readonly version: Version;
  readonly userId: UserId;
  readonly examId: ExamId;
  readonly sessionId: string;
  readonly status: AttemptStatus;
  readonly questionResponses: ReadonlyArray<QuestionResponse>;
  readonly startedAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
  readonly totalScore: number | null;
  readonly metadata: Record<string, unknown>;
}

export function createAttempt(contract: AttemptContract): Attempt {
  return {
    id: contract.id,
    version: contract.version,
    userId: contract.userId,
    examId: contract.examId,
    sessionId: contract.sessionId,
    status: contract.status,
    questionResponses: contract.questionResponses,
    startedAt: contract.startedAt,
    completedAt: contract.completedAt,
    totalScore: contract.totalScore,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function attemptResponseCount(attempt: Attempt): number {
  return attempt.questionResponses.length;
}

export function attemptIsScored(attempt: Attempt): boolean {
  return attempt.status === 'scored' || attempt.status === 'reviewed';
}
