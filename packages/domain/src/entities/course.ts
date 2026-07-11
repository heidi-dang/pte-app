import type { IsoTimestamp } from '@pte-app/contracts';

export interface Course {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly modules: CourseModule[];
  readonly isFree: boolean;
  readonly prerequisites?: string[];
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
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly estimatedMinutes: number;
}

export interface Lesson {
  readonly id: string;
  readonly courseId: string;
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
  readonly lessonId: string;
  readonly completed: boolean;
  readonly completedAt?: IsoTimestamp;
  readonly position?: Record<string, unknown>;
}
