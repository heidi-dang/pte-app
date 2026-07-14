import type { CourseContract } from '@pte-app/contracts';
import type { CourseId, LessonId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Course {
  readonly id: CourseId;
  readonly version: Version;
  readonly title: string;
  readonly description: string;
  readonly lessonIds: ReadonlyArray<LessonId>;
  readonly difficulty: string;
  readonly estimatedMinutes: number;
  readonly tags: ReadonlyArray<string>;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createCourse(contract: CourseContract): Course {
  return {
    id: contract.id,
    version: contract.version,
    title: contract.title,
    description: contract.description,
    lessonIds: contract.lessonIds,
    difficulty: contract.difficulty,
    estimatedMinutes: contract.estimatedMinutes,
    tags: contract.tags,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function courseLessonCount(course: Course): number {
  return course.lessonIds.length;
}

export function courseHasLesson(course: Course, lessonId: LessonId): boolean {
  return course.lessonIds.includes(lessonId);
}
