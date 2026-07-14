import type { CourseId, Version, ISO8601DateTime, NonEmptyString, JsonObject } from '@pte-app/types';

export interface CourseContract {
  readonly id: CourseId;
  readonly version: Version;
  readonly title: NonEmptyString;
  readonly description: string;
  readonly lessonIds: ReadonlyArray<string>;
  readonly difficulty: string;
  readonly estimatedMinutes: number;
  readonly tags: ReadonlyArray<string>;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}
