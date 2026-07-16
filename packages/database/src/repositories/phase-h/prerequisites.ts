import type { DatabaseConnection } from '../../client.js';
import type {
  LessonId,
  CourseModuleId,
  CourseId,
  PrerequisiteId,
  LessonPrerequisiteRecord,
  LessonLockCode,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreatePrerequisiteInput {
  readonly lessonId: LessonId;
  readonly requiredLessonId: LessonId | null;
  readonly requiredModuleId: CourseModuleId | null;
  readonly requiredCourseId: CourseId | null;
  readonly prerequisiteType: 'lesson_completion' | 'module_completion' | 'course_completion' | 'entitlement';
  readonly createdBy: string;
}

export interface PrerequisiteStatus {
  readonly satisfied: boolean;
  readonly locked: boolean;
  readonly reason: LessonLockCode | null;
  readonly blockingPrerequisiteId: PrerequisiteId | null;
}

async function detectCycle(
  connection: DatabaseConnection,
  lessonId: LessonId,
  requiredLessonId: LessonId,
): Promise<boolean> {
  const result = await connection.pool.query<{ reachable: boolean }>(
    `WITH RECURSIVE prereq_chain(lesson_id) AS (
       SELECT $2::uuid
       UNION
       SELECT lp.required_lesson_id
       FROM lesson_prerequisites lp
       JOIN prereq_chain pc ON lp.lesson_id = pc.lesson_id
       WHERE lp.required_lesson_id IS NOT NULL
         AND lp.lesson_id != $1::uuid
     )
     SELECT EXISTS(SELECT 1 FROM prereq_chain WHERE lesson_id = $1::uuid) AS reachable`,
    [lessonId, requiredLessonId],
  );
  return result.rows[0]?.reachable ?? false;
}

export async function createPrerequisite(
  connection: DatabaseConnection,
  input: CreatePrerequisiteInput,
): Promise<LessonPrerequisiteRecord> {
  if (input.requiredLessonId) {
    const hasCycle = await detectCycle(connection, input.lessonId, input.requiredLessonId);
    if (hasCycle) {
      throw new Error(
        `Cannot create prerequisite: cycle detected between lesson ${input.lessonId} and ${input.requiredLessonId}`,
      );
    }
  }

  const id = randomUUID() as PrerequisiteId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_prerequisites (id, lesson_id, required_lesson_id, required_module_id,
      required_course_id, prerequisite_type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, lesson_id as "lessonId", required_lesson_id as "requiredLessonId",
       required_module_id as "requiredModuleId", required_course_id as "requiredCourseId",
       prerequisite_type as "prerequisiteType", created_by as "createdBy", created_at as "createdAt"`,
    [
      id,
      input.lessonId,
      input.requiredLessonId,
      input.requiredModuleId,
      input.requiredCourseId,
      input.prerequisiteType,
      input.createdBy,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create prerequisite');
  return row as unknown as LessonPrerequisiteRecord;
}

export async function getPrerequisites(
  connection: DatabaseConnection,
  lessonId: LessonId,
): Promise<LessonPrerequisiteRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, lesson_id as "lessonId", required_lesson_id as "requiredLessonId",
      required_module_id as "requiredModuleId", required_course_id as "requiredCourseId",
      prerequisite_type as "prerequisiteType", created_by as "createdBy", created_at as "createdAt"
     FROM lesson_prerequisites WHERE lesson_id = $1`,
    [lessonId],
  );
  return result.rows as unknown as LessonPrerequisiteRecord[];
}

export async function deletePrerequisite(connection: DatabaseConnection, id: PrerequisiteId): Promise<boolean> {
  const result = await connection.pool.query('DELETE FROM lesson_prerequisites WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function checkPrerequisites(
  connection: DatabaseConnection,
  lessonId: LessonId,
  userId: string,
): Promise<PrerequisiteStatus> {
  const prereqs = await getPrerequisites(connection, lessonId);
  if (prereqs.length === 0) {
    return { satisfied: true, locked: false, reason: null, blockingPrerequisiteId: null };
  }

  for (const prereq of prereqs) {
    if (prereq.prerequisiteType === 'lesson_completion' && prereq.requiredLessonId) {
      const progress = await connection.pool.query<{ status: string }>(
        `SELECT status FROM lesson_progress
         WHERE user_id = $1 AND lesson_id = $2
         ORDER BY last_activity_at DESC NULLS LAST LIMIT 1`,
        [userId, prereq.requiredLessonId],
      );
      if (!progress.rows[0] || progress.rows[0].status !== 'completed') {
        return {
          satisfied: false,
          locked: true,
          reason: 'PREREQUISITE_LESSON_INCOMPLETE',
          blockingPrerequisiteId: prereq.id,
        };
      }
    }

    if (prereq.prerequisiteType === 'module_completion' && prereq.requiredModuleId) {
      const incomplete = await connection.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM lessons l
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1 AND lp.status = 'completed'
         WHERE l.module_id = $2 AND l.is_optional = false AND lp.id IS NULL`,
        [userId, prereq.requiredModuleId],
      );
      if (parseInt(incomplete.rows[0]?.count ?? '0', 10) > 0) {
        return {
          satisfied: false,
          locked: true,
          reason: 'PREREQUISITE_MODULE_INCOMPLETE',
          blockingPrerequisiteId: prereq.id,
        };
      }
    }

    if (prereq.prerequisiteType === 'course_completion' && prereq.requiredCourseId) {
      const enrolment = await connection.pool.query<{ status: string }>(
        `SELECT status FROM course_enrolments WHERE user_id = $1 AND course_id = $2`,
        [userId, prereq.requiredCourseId],
      );
      if (!enrolment.rows[0] || enrolment.rows[0].status !== 'completed') {
        return {
          satisfied: false,
          locked: true,
          reason: 'PREREQUISITE_COURSE_INCOMPLETE',
          blockingPrerequisiteId: prereq.id,
        };
      }
    }
  }

  return { satisfied: true, locked: false, reason: null, blockingPrerequisiteId: null };
}

export { detectCycle };
