import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@pte-app/database';
import { users, phaseH } from '@pte-app/database';
import type { UserId, CourseId, CourseModuleId, LessonId } from '@pte-app/contracts';

export interface PhaseLTestUser {
  id: UserId;
  email: string;
  password: string;
  roles: string[];
}

export interface PhaseLTestFixtures {
  runId: string;
  admin: PhaseLTestUser;
  student: PhaseLTestUser;
  otherStudent: PhaseLTestUser;
  otherToken: string;
  courseId: CourseId;
  moduleId: CourseModuleId;
  lessonId: LessonId;
  sessionId: string;
  attemptId: string;
}

export async function createPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createUser(
  db: DatabaseConnection,
  email: string,
  password: string,
  roles: string[],
): Promise<PhaseLTestUser> {
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

export async function buildTestFixtures(db: DatabaseConnection): Promise<PhaseLTestFixtures> {
  const runId = randomUUID().slice(0, 8);

  const admin = await createUser(db, `phase-l-admin-${runId}@test.pte.app`, 'admin-pw', ['admin']);
  const student = await createUser(db, `phase-l-student-${runId}@test.pte.app`, 'student-pw', ['student']);
  const otherStudent = await createUser(db, `phase-l-other-${runId}@test.pte.app`, 'other-pw', ['student']);

  const course = await phaseH.courses.createCourse(db, {
    slug: `phase-l-test-${runId}`,
    title: `Phase L Test Course ${runId}`,
    summary: 'Test course for Phase L integration tests',
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
    title: 'Phase L Test Module',
    description: 'Test module for Phase L',
    orderPosition: 0,
    createdBy: admin.id,
  });

  const lesson = await phaseH.lessons.createLesson(db, {
    moduleId: module.id,
    courseId: course.id,
    title: 'Phase L Test Lesson',
    slug: `phase-l-lesson-${runId}`,
    summary: 'Test lesson for Phase L',
    orderPosition: 0,
    isOptional: false,
    estimatedMinutes: 10,
    createdBy: admin.id,
  });

  await phaseH.lessons.publishLesson(db, lesson.id);

  const sessionId = randomUUID();
  await db.pool.query(
    `INSERT INTO question_sessions (id, user_id, lesson_id, status, mode, created_at, updated_at)
     VALUES ($1, $2, $3, 'active', 'learning', NOW(), NOW())`,
    [sessionId, student.id, lesson.id],
  );

  const attemptId = randomUUID();
  await db.pool.query(
    `INSERT INTO question_attempts (id, user_id, question_id, lesson_id, session_id, status, mode, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'created', 'learning', NOW(), NOW())`,
    [attemptId, student.id, randomUUID(), lesson.id, sessionId],
  );

  return {
    runId,
    admin,
    student,
    otherStudent,
    courseId: course.id,
    moduleId: module.id,
    lessonId: lesson.id,
    sessionId,
    attemptId,
    otherToken: '',
  };
}
