import type {
  QuestionAttemptRecord,
  QuestionAttemptStatus,
  QuestionAttemptMode,
  QuestionResponseEnvelope,
} from '@pte-app/contracts';
import { isValidTransition } from '@pte-app/contracts';
import type {
  QuestionAttemptId,
  QuestionSessionId,
  QuestionId,
  UserId,
  LessonId,
  IdempotencyKey,
  ISO8601DateTime,
} from '@pte-app/types';

export type { QuestionAttemptStatus, QuestionAttemptMode };

export interface QuestionAttempt {
  readonly id: QuestionAttemptId;
  readonly userId: UserId;
  readonly questionId: QuestionId;
  readonly lessonId: LessonId;
  readonly sessionId: QuestionSessionId;
  readonly status: QuestionAttemptStatus;
  readonly mode: QuestionAttemptMode;
  readonly versionSnapshotId: string | null;
  readonly response: Record<string, unknown> | null;
  readonly startedAt: ISO8601DateTime;
  readonly lastAutosavedAt: ISO8601DateTime | null;
  readonly submittedAt: ISO8601DateTime | null;
  readonly expiresAt: ISO8601DateTime | null;
  readonly timeLimitSeconds: number | null;
  readonly idempotencyKey: IdempotencyKey | null;
  readonly playCount: number;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createQuestionAttempt(record: QuestionAttemptRecord): QuestionAttempt {
  return {
    id: record.id,
    userId: record.userId,
    questionId: record.questionId,
    lessonId: record.lessonId,
    sessionId: record.sessionId,
    status: record.status,
    mode: record.mode,
    versionSnapshotId: record.versionSnapshotId,
    response: record.response as Record<string, unknown> | null,
    startedAt: record.startedAt,
    lastAutosavedAt: record.lastAutosavedAt,
    submittedAt: record.submittedAt,
    expiresAt: record.expiresAt,
    timeLimitSeconds: record.timeLimitSeconds,
    idempotencyKey: record.idempotencyKey,
    playCount: record.playCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function attemptIsTerminal(attempt: QuestionAttempt): boolean {
  return attempt.status === 'submitted' || attempt.status === 'reviewable' || attempt.status === 'expired';
}

export function attemptIsActive(attempt: QuestionAttempt): boolean {
  return attempt.status === 'in_progress' || attempt.status === 'autosaved' || attempt.status === 'recovered';
}

export function attemptIsSubmittable(attempt: QuestionAttempt): boolean {
  return attempt.status === 'in_progress' || attempt.status === 'autosaved' || attempt.status === 'recovered';
}

export function attemptCanTransition(attempt: QuestionAttempt, to: QuestionAttemptStatus): boolean {
  return isValidTransition(attempt.status, to);
}

export function attemptIsExpired(attempt: QuestionAttempt): boolean {
  if (attempt.status === 'expired') return true;
  if (attempt.expiresAt && new Date(attempt.expiresAt) <= new Date()) return true;
  return false;
}

export function attemptIsInterrupted(attempt: QuestionAttempt): boolean {
  return attempt.status === 'interrupted';
}

export function attemptCanRecover(attempt: QuestionAttempt): boolean {
  return attempt.status === 'interrupted';
}

export function buildResponseEnvelope(
  attempt: QuestionAttempt,
  playback: ReadonlyArray<Record<string, unknown>> | null,
  serverNow: ISO8601DateTime,
): QuestionResponseEnvelope {
  const remainingSeconds =
    attempt.expiresAt && attempt.timeLimitSeconds
      ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - new Date(serverNow).getTime()) / 1000))
      : null;

  return {
    attemptId: attempt.id,
    status: attempt.status,
    response: attempt.response as Record<string, unknown> | null,
    mode: attempt.mode,
    startedAt: attempt.startedAt,
    lastAutosavedAt: attempt.lastAutosavedAt,
    submittedAt: attempt.submittedAt,
    timeLimitSeconds: attempt.timeLimitSeconds,
    serverNow,
    remainingSeconds,
    playback: playback as ReadonlyArray<Record<string, unknown>> | null,
  } as unknown as QuestionResponseEnvelope;
}
