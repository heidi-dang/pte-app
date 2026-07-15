import type { DatabaseConnection } from '../../client.js';
import type {
  CourseId,
  CourseModuleId,
  EnrolmentId,
  LessonId,
  LessonVersionId,
  LessonProgressId,
  LessonProgressRecord,
  ProgressUpdate,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export async function upsertProgress(
  connection: DatabaseConnection,
  userId: string,
  enrolmentId: EnrolmentId,
  courseId: CourseId,
  moduleId: CourseModuleId,
  lessonId: LessonId,
  lessonVersionId: LessonVersionId,
  update: ProgressUpdate,
): Promise<LessonProgressRecord> {
  const id = randomUUID() as LessonProgressId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_progress (id, user_id, enrolment_id, course_id, module_id, lesson_id,
      lesson_version_id, last_block_id, block_position, progress_percentage, status,
      started_at, last_activity_at, mutation_id, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       CASE WHEN $10 >= 100 THEN 'completed' WHEN $10 > 0 THEN 'in_progress' ELSE 'not_started' END,
       CASE WHEN $10 > 0 THEN COALESCE(
         (SELECT started_at FROM lesson_progress WHERE user_id = $2 AND lesson_id = $6 AND mutation_id = $15), NOW()
       ) ELSE NULL END,
       NOW(), $15, 1)
     ON CONFLICT (user_id, lesson_id, mutation_id) DO UPDATE SET
       last_block_id = EXCLUDED.last_block_id,
       block_position = EXCLUDED.block_position,
       progress_percentage = EXCLUDED.progress_percentage,
       status = CASE WHEN EXCLUDED.progress_percentage >= 100 THEN 'completed'
                     WHEN EXCLUDED.progress_percentage > 0 THEN 'in_progress'
                     ELSE 'not_started' END,
       last_activity_at = NOW(),
       version = lesson_progress.version + 1
     RETURNING id, user_id as "userId", enrolment_id as "enrolmentId", course_id as "courseId",
       module_id as "moduleId", lesson_id as "lessonId",
       lesson_version_id as "lessonVersionId", last_block_id as "lastBlockId",
       block_position as "blockPosition", progress_percentage as "progressPercentage",
       status, started_at as "startedAt", last_activity_at as "lastActivityAt",
       completed_at as "completedAt", mutation_id as "mutationId", version`,
    [
      id,
      userId,
      enrolmentId,
      courseId,
      moduleId,
      lessonId,
      lessonVersionId,
      update.blockId,
      update.blockPosition,
      update.progressPercentage,
      update.blockId,
      lessonId,
      update.blockId,
      lessonId,
      update.mutationId,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to upsert progress');
  return row as unknown as LessonProgressRecord;
}

export async function getProgress(
  connection: DatabaseConnection,
  userId: string,
  lessonId: LessonId,
): Promise<LessonProgressRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", enrolment_id as "enrolmentId", course_id as "courseId",
      module_id as "moduleId", lesson_id as "lessonId",
      lesson_version_id as "lessonVersionId", last_block_id as "lastBlockId",
      block_position as "blockPosition", progress_percentage as "progressPercentage",
      status, started_at as "startedAt", last_activity_at as "lastActivityAt",
      completed_at as "completedAt", mutation_id as "mutationId", version
     FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2
     ORDER BY last_activity_at DESC LIMIT 1`,
    [userId, lessonId],
  );
  return result.rows[0] as unknown as LessonProgressRecord | undefined;
}

export async function listProgressForEnrolment(
  connection: DatabaseConnection,
  enrolmentId: EnrolmentId,
): Promise<LessonProgressRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", enrolment_id as "enrolmentId", course_id as "courseId",
      module_id as "moduleId", lesson_id as "lessonId",
      lesson_version_id as "lessonVersionId", last_block_id as "lastBlockId",
      block_position as "blockPosition", progress_percentage as "progressPercentage",
      status, started_at as "startedAt", last_activity_at as "lastActivityAt",
      completed_at as "completedAt", mutation_id as "mutationId", version
     FROM lesson_progress WHERE enrolment_id = $1
     ORDER BY last_activity_at DESC`,
    [enrolmentId],
  );
  return result.rows as unknown as LessonProgressRecord[];
}

export async function completeProgress(
  connection: DatabaseConnection,
  userId: string,
  lessonId: LessonId,
): Promise<LessonProgressRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE lesson_progress SET status = 'completed', completed_at = NOW(),
      progress_percentage = 100, version = version + 1, last_activity_at = NOW()
     WHERE user_id = $1 AND lesson_id = $2
     RETURNING id, user_id as "userId", enrolment_id as "enrolmentId", course_id as "courseId",
       module_id as "moduleId", lesson_id as "lessonId",
       lesson_version_id as "lessonVersionId", last_block_id as "lastBlockId",
       block_position as "blockPosition", progress_percentage as "progressPercentage",
       status, started_at as "startedAt", last_activity_at as "lastActivityAt",
       completed_at as "completedAt", mutation_id as "mutationId", version`,
    [userId, lessonId],
  );
  return result.rows[0] as unknown as LessonProgressRecord | undefined;
}
