import type { ProgressContract } from '@pte-app/contracts';
import type { ProgressId, UserId, CourseId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Progress {
  readonly id: ProgressId;
  readonly version: Version;
  readonly userId: UserId;
  readonly courseId: CourseId;
  readonly completedLessonIds: ReadonlyArray<string>;
  readonly attemptedTaskIds: ReadonlyArray<string>;
  readonly score: number | null;
  readonly completionPercentage: number;
  readonly startedAt: ISO8601DateTime;
  readonly lastActivityAt: ISO8601DateTime;
  readonly metadata: Record<string, unknown>;
}

export function createProgress(contract: ProgressContract): Progress {
  return {
    id: contract.id,
    version: contract.version,
    userId: contract.userId,
    courseId: contract.courseId,
    completedLessonIds: contract.completedLessonIds,
    attemptedTaskIds: contract.attemptedTaskIds,
    score: contract.score,
    completionPercentage: contract.completionPercentage,
    startedAt: contract.startedAt,
    lastActivityAt: contract.lastActivityAt,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function progressIsComplete(progress: Progress): boolean {
  return progress.completionPercentage >= 100;
}

export function progressHasScore(progress: Progress): boolean {
  return progress.score !== null;
}
