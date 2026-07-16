import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@pte-app/database';
import { users } from '@pte-app/database';
import type { UserId } from '@pte-app/contracts';

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
  lessonId: string;
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

  // Create a minimal lesson for the session
  const lessonId = randomUUID();
  await db.pool.query(
    `INSERT INTO lessons (id, module_id, course_id, title, slug, summary, order_position, is_optional, estimated_minutes, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 0, false, 10, 'published', $7, NOW(), NOW())`,
    [lessonId, randomUUID(), randomUUID(), 'Phase I Test Lesson', `phase-i-test-${runId}`, 'Test lesson for Phase I', admin.id],
  );

  const questionIds = [randomUUID(), randomUUID()];

  return {
    runId,
    admin,
    student,
    lessonId,
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
