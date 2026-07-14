import type { LessonContract } from '@pte-app/contracts';
import type { LessonId, CourseId, TaskId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Lesson {
  readonly id: LessonId;
  readonly version: Version;
  readonly courseId: CourseId;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly taskIds: ReadonlyArray<TaskId>;
  readonly estimatedMinutes: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createLesson(contract: LessonContract): Lesson {
  return {
    id: contract.id,
    version: contract.version,
    courseId: contract.courseId,
    title: contract.title,
    description: contract.description,
    order: contract.order,
    taskIds: contract.taskIds,
    estimatedMinutes: contract.estimatedMinutes,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function lessonTaskCount(lesson: Lesson): number {
  return lesson.taskIds.length;
}
