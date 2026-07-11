import type { PaginationParams, PaginationMeta } from '@pte-app/contracts';
import type { User } from '../entities/user.js';
import type { ContentItem } from '../entities/content.js';
import type { Course, Lesson } from '../entities/course.js';
import type { Attempt } from '../entities/attempt.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: Partial<User>): Promise<User>;
  update(id: string, changes: Partial<User>): Promise<User>;
  list(params: PaginationParams): Promise<{ items: User[]; meta: PaginationMeta }>;
}

export interface ContentRepository {
  findById(id: string): Promise<ContentItem | null>;
  findByTaskType(taskType: string, params: PaginationParams): Promise<{ items: ContentItem[]; meta: PaginationMeta }>;
  create(input: Partial<ContentItem>): Promise<ContentItem>;
  update(id: string, changes: Partial<ContentItem>): Promise<ContentItem>;
}

export interface CourseRepository {
  findById(id: string): Promise<Course | null>;
  list(params: PaginationParams): Promise<{ items: Course[]; meta: PaginationMeta }>;
}

export interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
  findByCourseId(courseId: string): Promise<Lesson[]>;
}

export interface AttemptRepository {
  findById(id: string): Promise<Attempt | null>;
  findByUserId(userId: string, params: PaginationParams): Promise<{ items: Attempt[]; meta: PaginationMeta }>;
  create(input: Partial<Attempt>): Promise<Attempt>;
  update(id: string, changes: Partial<Attempt>): Promise<Attempt>;
}
