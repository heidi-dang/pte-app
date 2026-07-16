export type CourseId = string & { __brand: 'CourseId' };
export type CourseVersionId = string & { __brand: 'CourseVersionId' };
export type CourseModuleId = string & { __brand: 'CourseModuleId' };
export type LessonId = string & { __brand: 'LessonId' };
export type LessonVersionId = string & { __brand: 'LessonVersionId' };
export type LessonBlockId = string & { __brand: 'LessonBlockId' };
export type EnrolmentId = string & { __brand: 'EnrolmentId' };
export type LessonProgressId = string & { __brand: 'LessonProgressId' };
export type LessonQuizId = string & { __brand: 'LessonQuizId' };
export type LessonQuizItemId = string & { __brand: 'LessonQuizItemId' };
export type LessonQuizAttemptId = string & { __brand: 'LessonQuizAttemptId' };
export type TeacherNoteId = string & { __brand: 'TeacherNoteId' };
export type PrerequisiteId = string & { __brand: 'PrerequisiteId' };

export type LessonBlockType = 'text' | 'audio' | 'video' | 'interactive';

export type LessonQuizItemType = 'single_choice' | 'multiple_choice' | 'true_false';

export type CourseAccessLevel = 'free' | 'paid' | 'entitlement';

export type LessonLockCode =
  | 'NOT_ENROLLED'
  | 'ENTITLEMENT_REQUIRED'
  | 'PREREQUISITE_LESSON_INCOMPLETE'
  | 'PREREQUISITE_MODULE_INCOMPLETE'
  | 'PREREQUISITE_COURSE_INCOMPLETE'
  | 'CONTENT_NOT_PUBLISHED'
  | 'CONTENT_RETIRED'
  | 'CONTENT_VERSION_UNAVAILABLE';

export interface CourseRecord {
  readonly id: CourseId;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly accessLevel: CourseAccessLevel;
  readonly difficulty: string;
  readonly estimatedDurationMinutes: number;
  readonly skillTags: readonly string[];
  readonly thumbnailMediaId: string | null;
  readonly status: 'draft' | 'published' | 'retired';
  readonly version: number;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
}

export interface CourseVersionRecord {
  readonly id: CourseVersionId;
  readonly courseId: CourseId;
  readonly version: number;
  readonly snapshot: unknown;
  readonly reason: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface CourseModuleRecord {
  readonly id: CourseModuleId;
  readonly courseId: CourseId;
  readonly title: string;
  readonly description: string;
  readonly orderPosition: number;
  readonly status: 'draft' | 'published' | 'retired';
  readonly version: number;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LessonPrerequisiteRecord {
  readonly id: PrerequisiteId;
  readonly lessonId: LessonId;
  readonly requiredLessonId: LessonId | null;
  readonly requiredModuleId: CourseModuleId | null;
  readonly requiredCourseId: CourseId | null;
  readonly prerequisiteType: 'lesson_completion' | 'module_completion' | 'course_completion' | 'entitlement';
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface LessonRecord {
  readonly id: LessonId;
  readonly moduleId: CourseModuleId;
  readonly courseId: CourseId;
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly orderPosition: number;
  readonly isOptional: boolean;
  readonly estimatedMinutes: number;
  readonly quizId: LessonQuizId | null;
  readonly status: 'draft' | 'published' | 'retired';
  readonly version: number;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LessonVersionRecord {
  readonly id: LessonVersionId;
  readonly lessonId: LessonId;
  readonly version: number;
  readonly snapshot: unknown;
  readonly reason: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface LessonBlockRecord {
  readonly id: LessonBlockId;
  readonly lessonId: LessonId;
  readonly lessonVersionId: LessonVersionId;
  readonly blockType: LessonBlockType;
  readonly orderPosition: number;
  readonly title: string;
  readonly content: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnrolmentRecord {
  readonly id: EnrolmentId;
  readonly userId: string;
  readonly courseId: CourseId;
  readonly courseVersionId: CourseVersionId;
  readonly enrolledAt: string;
  readonly completedAt: string | null;
  readonly status: 'active' | 'completed' | 'cancelled';
}

export interface LessonProgressRecord {
  readonly id: LessonProgressId;
  readonly userId: string;
  readonly enrolmentId: EnrolmentId;
  readonly courseId: CourseId;
  readonly moduleId: CourseModuleId;
  readonly lessonId: LessonId;
  readonly lessonVersionId: LessonVersionId;
  readonly lastBlockId: LessonBlockId | null;
  readonly blockPosition: number;
  readonly progressPercentage: number;
  readonly status: 'not_started' | 'in_progress' | 'completed';
  readonly startedAt: string | null;
  readonly lastActivityAt: string | null;
  readonly completedAt: string | null;
  readonly mutationId: string;
  readonly version: number;
}

export interface LessonQuizRecord {
  readonly id: LessonQuizId;
  readonly lessonId: LessonId;
  readonly title: string;
  readonly passThreshold: number;
  readonly isRequired: boolean;
}

export interface LessonQuizItemRecord {
  readonly id: LessonQuizItemId;
  readonly quizId: LessonQuizId;
  readonly itemType: LessonQuizItemType;
  readonly question: string;
  readonly options: readonly string[];
  readonly correctAnswers: readonly number[];
  readonly orderPosition: number;
  readonly explanation: string;
}

export interface LessonQuizAttemptRecord {
  readonly id: LessonQuizAttemptId;
  readonly quizId: LessonQuizId;
  readonly userId: string;
  readonly score: number;
  readonly totalItems: number;
  readonly passed: boolean;
  readonly answers: readonly number[][];
  readonly attemptNumber: number;
  readonly submissionId: string;
  readonly createdAt: string;
}

export interface TeacherNoteRecord {
  readonly id: TeacherNoteId;
  readonly entityType: 'course' | 'module' | 'lesson';
  readonly entityId: string;
  readonly content: string;
  readonly authorId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CourseCatalogueQuery {
  readonly searchText?: string;
  readonly accessLevel?: CourseAccessLevel;
  readonly enrolled?: boolean;
  readonly difficulty?: string;
  readonly skillTag?: string;
  readonly pageSize?: number;
  readonly cursor?: string;
}

export interface CourseCatalogueResult {
  readonly courses: readonly CourseRecord[];
  readonly totalCount: number;
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface CourseDetail {
  readonly course: CourseRecord;
  readonly modules: readonly CourseModuleDetail[];
  readonly enrolment: EnrolmentRecord | null;
  readonly completionPercentage: number;
}

export interface CourseModuleDetail {
  readonly module: CourseModuleRecord;
  readonly lessons: readonly LessonDetail[];
  readonly completionPercentage: number;
}

export interface LessonDetail {
  readonly lesson: LessonRecord;
  readonly progress: LessonProgressRecord | null;
  readonly blocks: readonly LessonBlockRecord[];
  readonly locked: boolean;
  readonly lockReason: LessonLockCode | null;
  readonly prerequisites: readonly LessonPrerequisiteRecord[];
}

export interface ProgressUpdate {
  readonly mutationId: string;
  readonly blockId: LessonBlockId;
  readonly blockPosition: number;
  readonly progressPercentage: number;
}

export interface QuizSubmission {
  readonly submissionId: string;
  readonly answers: readonly number[][];
}

export interface QuizResult {
  readonly attempt: LessonQuizAttemptRecord;
  readonly passed: boolean;
  readonly feedback: readonly string[];
  readonly estimatedTrainingScore: string;
}
