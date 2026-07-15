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
  const now = new Date().toISOString();
  const r = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, teacher_id, course_id, status, starts_at, expires_at, revoked_at
     FROM teacher_assignments
     WHERE teacher_id = $1 AND course_id = $2 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > $3)
     ORDER BY created_at DESC LIMIT 1`,
    [teacherId, courseId, now],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id as string, teacherId: row.teacher_id as string, courseId: row.course_id as string,
    status: row.status as 'active', startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string | null, revokedAt: row.revoked_at as string | null,
  };
}

export async function isTeacherAssignedToCourse(
  connection: DatabaseConnection,
  teacherId: string,
  courseId: string,
): Promise<boolean> {
  const assignment = await getTeacherAssignment(connection, teacherId, courseId);
  return assignment !== null;
}
