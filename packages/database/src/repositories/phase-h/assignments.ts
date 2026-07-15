import type { DatabaseConnection } from '../../client.js';

export interface AssignmentRecord {
  id: string;
  teacherId: string;
  courseId: string;
  status: 'active' | 'expired' | 'revoked';
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export async function getTeacherAssignment(
  connection: DatabaseConnection,
  teacherId: string,
  courseId: string,
): Promise<AssignmentRecord | null> {
  const r = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, teacher_id, course_id, status, starts_at, expires_at, revoked_at
     FROM teacher_assignments
     WHERE teacher_id = $1 AND course_id = $2 AND status = 'active'
       AND starts_at <= CURRENT_TIMESTAMP
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY created_at DESC LIMIT 1`,
    [teacherId, courseId],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    courseId: row.course_id as string,
    status: 'active',
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string | null,
    revokedAt: row.revoked_at as string | null,
  };
}

export async function isTeacherAssignedToCourse(
  connection: DatabaseConnection,
  teacherId: string,
  courseId: string,
): Promise<boolean> {
  return (await getTeacherAssignment(connection, teacherId, courseId)) !== null;
}

export async function createTeacherAssignment(
  connection: DatabaseConnection,
  input: { teacherId: string; courseId: string; expiresAt?: string | null },
): Promise<AssignmentRecord> {
  const existing = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, teacher_id, course_id, status, starts_at, expires_at, revoked_at
     FROM teacher_assignments WHERE teacher_id=$1 AND course_id=$2 AND status='active'
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) LIMIT 1`,
    [input.teacherId, input.courseId],
  );
  if (existing.rows[0]) {
    const row = existing.rows[0];
    return {
      id: row.id as string,
      teacherId: row.teacher_id as string,
      courseId: row.course_id as string,
      status: 'active',
      startsAt: row.starts_at as string,
      expiresAt: row.expires_at as string | null,
      revokedAt: row.revoked_at as string | null,
    };
  }

  const r = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO teacher_assignments (teacher_id, course_id, expires_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (teacher_id, course_id) WHERE status = 'active' DO NOTHING
     RETURNING id, teacher_id, course_id, status, starts_at, expires_at, revoked_at`,
    [input.teacherId, input.courseId, input.expiresAt ?? null],
  );
  if (r.rows[0]) {
    const row = r.rows[0];
    return {
      id: row.id as string,
      teacherId: row.teacher_id as string,
      courseId: row.course_id as string,
      status: 'active',
      startsAt: row.starts_at as string,
      expiresAt: row.expires_at as string | null,
      revokedAt: row.revoked_at as string | null,
    };
  }

  const dup = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, teacher_id, course_id, status, starts_at, expires_at, revoked_at
     FROM teacher_assignments WHERE teacher_id=$1 AND course_id=$2 AND status='active' LIMIT 1`,
    [input.teacherId, input.courseId],
  );
  if (dup.rows[0]) {
    const row = dup.rows[0];
    return {
      id: row.id as string,
      teacherId: row.teacher_id as string,
      courseId: row.course_id as string,
      status: 'active',
      startsAt: row.starts_at as string,
      expiresAt: row.expires_at as string | null,
      revokedAt: row.revoked_at as string | null,
    };
  }
  throw new Error('Failed to create teacher assignment');
}

export async function revokeTeacherAssignment(
  connection: DatabaseConnection,
  teacherId: string,
  courseId: string,
): Promise<AssignmentRecord | null> {
  const r = await connection.pool.query<Record<string, unknown>>(
    `UPDATE teacher_assignments SET status='revoked', revoked_at=NOW()
     WHERE teacher_id=$1 AND course_id=$2 AND status='active'
     RETURNING id, teacher_id, course_id, status, starts_at, expires_at, revoked_at`,
    [teacherId, courseId],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    courseId: row.course_id as string,
    status: 'revoked',
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string | null,
    revokedAt: row.revoked_at as string | null,
  };
}
