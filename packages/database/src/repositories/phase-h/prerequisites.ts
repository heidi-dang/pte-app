import type { DatabaseConnection } from '../../client.js';
import type {
  LessonId,
  CourseModuleId,
  CourseId,
  PrerequisiteId,
  LessonPrerequisiteRecord,
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

async function detectCycle(
  connection: DatabaseConnection,
  lessonId: LessonId,
  requiredLessonId: LessonId,
): Promise<boolean> {
  const visited = new Set<string>();
  const stack: string[] = [requiredLessonId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || current === lessonId) return current === lessonId;
    if (visited.has(current)) continue;
    visited.add(current);

    const result = await connection.pool.query<Record<string, unknown>>(
      `SELECT required_lesson_id FROM lesson_prerequisites
       WHERE lesson_id = $1 AND required_lesson_id IS NOT NULL`,
      [current],
    );
    for (const row of result.rows) {
      const nextId = row.required_lesson_id as string;
      if (!visited.has(nextId)) {
        stack.push(nextId);
      }
    }
  }

  return false;
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

export async function deletePrerequisite(
  connection: DatabaseConnection,
  id: PrerequisiteId,
): Promise<boolean> {
  const result = await connection.pool.query('DELETE FROM lesson_prerequisites WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export { detectCycle };
