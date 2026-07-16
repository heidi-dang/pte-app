import type { DatabaseConnection } from '../../client.js';
import type { CourseId, CourseVersionId, EnrolmentId, EnrolmentRecord } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateEnrolmentInput {
  readonly userId: string;
  readonly courseId: CourseId;
  readonly courseVersionId: CourseVersionId;
}

export async function createEnrolment(
  connection: DatabaseConnection,
  input: CreateEnrolmentInput,
): Promise<EnrolmentRecord> {
  const id = randomUUID() as EnrolmentId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO course_enrolments (id, user_id, course_id, course_version_id, enrolled_at, status)
     VALUES ($1, $2, $3, $4, NOW(), 'active')
     ON CONFLICT (user_id, course_id) DO NOTHING
     RETURNING id, user_id as "userId", course_id as "courseId",
       course_version_id as "courseVersionId", enrolled_at as "enrolledAt",
       completed_at as "completedAt", status`,
    [id, input.userId, input.courseId, input.courseVersionId],
  );

  const row = result.rows[0];
  if (!row) {
    const existing = await connection.pool.query<Record<string, unknown>>(
      `SELECT id, user_id as "userId", course_id as "courseId",
        course_version_id as "courseVersionId", enrolled_at as "enrolledAt",
        completed_at as "completedAt", status
       FROM course_enrolments WHERE user_id = $1 AND course_id = $2`,
      [input.userId, input.courseId],
    );
    const existingRow = existing.rows[0];
    if (!existingRow) throw new Error('Failed to create enrolment');
    return existingRow as unknown as EnrolmentRecord;
  }
  return row as unknown as EnrolmentRecord;
}

export async function getEnrolment(
  connection: DatabaseConnection,
  userId: string,
  courseId: CourseId,
): Promise<EnrolmentRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", course_id as "courseId",
      course_version_id as "courseVersionId", enrolled_at as "enrolledAt",
      completed_at as "completedAt", status
     FROM course_enrolments WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId],
  );
  return result.rows[0] as unknown as EnrolmentRecord | undefined;
}

export async function listEnrolmentsForUser(
  connection: DatabaseConnection,
  userId: string,
): Promise<EnrolmentRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", course_id as "courseId",
      course_version_id as "courseVersionId", enrolled_at as "enrolledAt",
      completed_at as "completedAt", status
     FROM course_enrolments WHERE user_id = $1
     ORDER BY enrolled_at DESC`,
    [userId],
  );
  return result.rows as unknown as EnrolmentRecord[];
}

export async function completeEnrolment(
  connection: DatabaseConnection,
  userId: string,
  courseId: CourseId,
): Promise<EnrolmentRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE course_enrolments SET status = 'completed', completed_at = NOW()
     WHERE user_id = $1 AND course_id = $2
     RETURNING id, user_id as "userId", course_id as "courseId",
       course_version_id as "courseVersionId", enrolled_at as "enrolledAt",
       completed_at as "completedAt", status`,
    [userId, courseId],
  );
  return result.rows[0] as unknown as EnrolmentRecord | undefined;
}
