import type { ProgressId, UserId, CourseId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface ProgressContract {
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
  readonly metadata: JsonObject;
}
