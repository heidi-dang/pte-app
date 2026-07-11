/**
 * Course Engine
 *
 * Manages course catalogue, enrolment, lesson progression,
 * completion tracking and prerequisite validation.
 */

import type { Course, CourseModule, Lesson, LessonProgress } from '@pte-app/domain';

export interface CourseCatalogue {
  readonly courses: Course[];
  readonly total: number;
}

export interface Enrolment {
  readonly userId: string;
  readonly courseId: string;
  readonly enrolledAt: string;
  readonly completed: boolean;
  readonly completedAt?: string;
}

export interface LessonResult {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly score?: number;
  readonly position?: Record<string, unknown>;
}

export class CourseEngineService {
  constructor(
    private readonly courseStore: Map<string, Course>,
    private readonly lessonStore: Map<string, Lesson>,
    private readonly progressStore: Map<string, LessonProgress>,
    private readonly enrolmentStore: Map<string, Enrolment>,
  ) {}

  // --- Catalogue ---

  async listCourses(filter?: { isFree?: boolean; search?: string }): Promise<CourseCatalogue> {
    let courses = Array.from(this.courseStore.values());
    if (filter?.isFree !== undefined) {
      courses = courses.filter((c) => c.isFree === filter.isFree);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      courses = courses.filter((c) => c.title.toLowerCase().includes(q));
    }
    return { courses, total: courses.length };
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return this.courseStore.get(courseId) ?? null;
  }

  // --- Enrolment ---

  async enrol(userId: string, courseId: string): Promise<Enrolment> {
    const course = this.courseStore.get(courseId);
    if (!course) throw new Error(`Course not found: ${courseId}`);

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      for (const prereqId of course.prerequisites) {
        const completed = await this.isCourseCompleted(userId, prereqId);
        if (!completed) {
          throw new Error(`Prerequisite not completed: ${prereqId}`);
        }
      }
    }

    const enrolmentKey = `${userId}:${courseId}`;
    const enrolment: Enrolment = {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      completed: false,
    };
    this.enrolmentStore.set(enrolmentKey, enrolment);
    return enrolment;
  }

  async getEnrolment(userId: string, courseId: string): Promise<Enrolment | null> {
    return this.enrolmentStore.get(`${userId}:${courseId}`) ?? null;
  }

  private async isCourseCompleted(userId: string, courseId: string): Promise<boolean> {
    const enrolment = this.enrolmentStore.get(`${userId}:${courseId}`);
    return enrolment?.completed === true;
  }

  // --- Lessons ---

  async getLesson(lessonId: string): Promise<Lesson | null> {
    return this.lessonStore.get(lessonId) ?? null;
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    return Array.from(this.lessonStore.values()).filter((l) => l.courseId === courseId);
  }

  // --- Progress ---

  async saveProgress(userId: string, lessonId: string, result: LessonResult): Promise<LessonProgress> {
    const key = `${userId}:${lessonId}`;
    const progress: LessonProgress = {
      userId,
      lessonId,
      completed: result.completed,
      completedAt: result.completed ? new Date().toISOString() : undefined,
      position: result.position,
    };
    this.progressStore.set(key, progress);

    // Check if course is now complete
    const lesson = this.lessonStore.get(lessonId);
    if (lesson && result.completed) {
      await this.checkCourseCompletion(userId, lesson.courseId);
    }

    return progress;
  }

  async getProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    return this.progressStore.get(`${userId}:${lessonId}`) ?? null;
  }

  private async checkCourseCompletion(userId: string, courseId: string): Promise<void> {
    const lessons = await this.getLessons(courseId);
    const allCompleted = lessons.every((l) => {
      const progress = this.progressStore.get(`${userId}:${l.id}`);
      return progress?.completed === true;
    });

    if (allCompleted) {
      const enrolmentKey = `${userId}:${courseId}`;
      const enrolment = this.enrolmentStore.get(enrolmentKey);
      if (enrolment) {
        const updated = { ...enrolment, completed: true, completedAt: new Date().toISOString() };
        this.enrolmentStore.set(enrolmentKey, updated);
      }
    }
  }

  // --- Resume ---

  async getResumePosition(userId: string, courseId: string): Promise<LessonProgress | null> {
    const lessons = await this.getLessons(courseId);
    // Find the first incomplete lesson
    for (const lesson of lessons) {
      const progress = this.progressStore.get(`${userId}:${lesson.id}`);
      if (!progress?.completed) {
        return progress ?? null;
      }
    }
    return null;
  }
}
