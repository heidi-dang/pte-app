import type { LessonId, CourseId, TaskId, Version, ISO8601DateTime, NonEmptyString, JsonObject } from '@pte-app/types';

export interface LessonContract {
  readonly id: LessonId;
  readonly version: Version;
  readonly courseId: CourseId;
  readonly title: NonEmptyString;
  readonly description: string;
  readonly order: number;
  readonly taskIds: ReadonlyArray<TaskId>;
  readonly estimatedMinutes: number;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}
