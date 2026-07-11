import type { CourseId, LessonId, ContentId, IsoTimestamp } from '@pte-app/contracts';

export interface Course {
  readonly id: CourseId;
  readonly title: string;
  readonly description: string;
  readonly modules: CourseModule[];
  readonly isFree: boolean;
  readonly prerequisites?: CourseId[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CourseModule {
  readonly id: string;
  readonly title: string;
  readonly lessons: LessonSummary[];
  readonly order: number;
}

export interface LessonSummary {
  readonly id: LessonId;
  readonly title: string;
  readonly order: number;
  readonly estimatedMinutes: number;
}

export interface Lesson {
  readonly id: LessonId;
  readonly courseId: CourseId;
  readonly moduleId: string;
  readonly title: string;
  readonly content: LessonBlock[];
  readonly estimatedMinutes: number;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export type LessonBlockType = 'text' | 'audio' | 'video' | 'image' | 'question' | 'quiz';

export interface LessonBlock {
  readonly type: LessonBlockType;
  readonly id: string;
  readonly data: Record<string, unknown>;
  readonly order: number;
}

export interface LessonProgress {
  readonly userId: string;
  readonly lessonId: LessonId;
  readonly completed: boolean;
  readonly completedAt?: IsoTimestamp;
  readonly position?: Record<string, unknown>;
}
