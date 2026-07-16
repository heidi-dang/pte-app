import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@pte-app/database';
import { users, phaseH } from '@pte-app/database';
import type { UserId, CourseId, CourseModuleId, LessonId } from '@pte-app/contracts';

export interface PhaseITestUser {
  id: UserId;
  email: string;
  password: string;
  roles: string[];
}

export interface PhaseITestFixtures {
  runId: string;
  admin: PhaseITestUser;
  student: PhaseITestUser;
  courseId: CourseId;
  moduleId: CourseModuleId;
  lessonId: LessonId;
  questionIds: string[];
  mode: string;
}

export async function createPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createUser(
  db: DatabaseConnection,
  email: string,
  password: string,
  roles: string[],
): Promise<PhaseITestUser> {
  const hash = await createPasswordHash(password);
  const existing = await users.getUserByEmail(db, email);
  if (existing) {
    const existingRoles = await users.getUserRoles(db, existing.id);
    return { id: existing.id as UserId, email: existing.email, password, roles: existingRoles };
  }
  const user = await users.createUser(db, { email, passwordHash: hash });
  for (const role of roles) {
    await users.addUserRole(db, user.id, role);
  }
  return { id: user.id as UserId, email: user.email, password, roles };
}

export async function buildTestFixtures(db: DatabaseConnection): Promise<PhaseITestFixtures> {
  const runId = randomUUID().slice(0, 8);

  const admin = await createUser(db, `phase-i-admin-${runId}@test.pte.app`, 'admin-pw', ['admin']);
  const student = await createUser(db, `phase-i-student-${runId}@test.pte.app`, 'student-pw', ['student']);

  // Create a proper course and module (Phase H contract) so FK constraints are satisfied
  const course = await phaseH.courses.createCourse(db, {
    slug: `phase-i-test-${runId}`,
    title: `Phase I Test Course ${runId}`,
    summary: 'Test course for Phase I integration tests',
    description: '',
    accessLevel: 'free',
    difficulty: 'beginner',
    estimatedDurationMinutes: 30,
    skillTags: [],
    thumbnailMediaId: null,
    createdBy: admin.id,
  });

  const module = await phaseH.modules.createCourseModule(db, {
    courseId: course.id,
    title: 'Phase I Test Module',
    description: 'Test module for Phase I',
    orderPosition: 0,
    createdBy: admin.id,
  });

  // Create a minimal published lesson
  const lesson = await phaseH.lessons.createLesson(db, {
    moduleId: module.id,
    courseId: course.id,
    title: 'Phase I Test Lesson',
    slug: `phase-i-lesson-${runId}`,
    summary: 'Test lesson for Phase I',
    orderPosition: 0,
    isOptional: false,
    estimatedMinutes: 10,
    createdBy: admin.id,
  });

  await phaseH.lessons.publishLesson(db, lesson.id);

  const questionIds = [randomUUID(), randomUUID()];

  return {
    runId,
    admin,
    student,
    courseId: course.id,
    moduleId: module.id,
    lessonId: lesson.id,
    questionIds,
    mode: 'learning',
  };
}

// ─── Build fake/corrupt payloads for tests ─────────────────────

export function buildValidSingleAnswerResponse(): Record<string, unknown> {
  return { selectedIndex: 2 };
}

export function buildEmptyResponse(): Record<string, unknown> {
  return {};
}

export function buildCorruptPayload(): unknown {
  return 'not-an-object';
}

export function buildIncompleteResponse(): Record<string, unknown> {
  return { selectedIndex: null };
}

export function buildValidTextResponse(): Record<string, unknown> {
  return { text: 'This is my answer for the test question.' };
}
