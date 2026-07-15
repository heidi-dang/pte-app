import type { DatabaseConnection } from '../../client.js';
import type { CourseId, CourseModuleId, CourseModuleRecord } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateCourseModuleInput {
  readonly courseId: CourseId;
  readonly title: string;
  readonly description: string;
  readonly orderPosition: number;
  readonly createdBy: string;
}

export interface UpdateModuleInput {
  readonly title?: string;
  readonly description?: string;
  readonly orderPosition?: number;
}

export async function createCourseModule(
  connection: DatabaseConnection,
  input: CreateCourseModuleInput,
): Promise<CourseModuleRecord> {
  const id = randomUUID() as CourseModuleId;

  const existing = await connection.pool.query<Record<string, unknown>>(
    `SELECT id FROM course_modules WHERE course_id = $1 AND order_position = $2`,
    [input.courseId, input.orderPosition],
  );
  if (existing.rows.length > 0) {
    throw new Error(`Module at order position ${input.orderPosition} already exists for course ${input.courseId}`);
  }

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO course_modules (id, course_id, title, description, order_position, status, version, created_by)
     VALUES ($1, $2, $3, $4, $5, 'draft', 1, $6)
     RETURNING id, course_id as "courseId", title, description, order_position as "orderPosition",
       status, version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
    [id, input.courseId, input.title, input.description, input.orderPosition, input.createdBy],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create course module');
  return row as unknown as CourseModuleRecord;
}

export async function getCourseModuleById(
  connection: DatabaseConnection,
  id: CourseModuleId,
): Promise<CourseModuleRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, course_id as "courseId", title, description, order_position as "orderPosition",
      status, version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
     FROM course_modules WHERE id = $1`,
    [id],
  );
  return result.rows[0] as unknown as CourseModuleRecord | undefined;
}

export async function listModulesForCourse(
  connection: DatabaseConnection,
  courseId: CourseId,
): Promise<CourseModuleRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, course_id as "courseId", title, description, order_position as "orderPosition",
      status, version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
     FROM course_modules WHERE course_id = $1
     ORDER BY order_position ASC`,
    [courseId],
  );
  return result.rows as unknown as CourseModuleRecord[];
}

export async function updateModule(
  connection: DatabaseConnection,
  id: CourseModuleId,
  input: UpdateModuleInput,
): Promise<CourseModuleRecord | undefined> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    sets.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${index++}`);
    values.push(input.description);
  }
  if (input.orderPosition !== undefined) {
    sets.push(`order_position = $${index++}`);
    values.push(input.orderPosition);
  }

  if (sets.length === 0) return getCourseModuleById(connection, id);

  sets.push(`version = version + 1`);
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE course_modules SET ${sets.join(', ')} WHERE id = $${index}
     RETURNING id, course_id as "courseId", title, description, order_position as "orderPosition",
       status, version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] as unknown as CourseModuleRecord | undefined;
}

export async function reorderModules(
  connection: DatabaseConnection,
  courseId: CourseId,
  orderedIds: readonly CourseModuleId[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await connection.pool.query(
      `UPDATE course_modules SET order_position = $1, updated_at = NOW()
       WHERE id = $2 AND course_id = $3`,
      [i + 1, orderedIds[i], courseId],
    );
  }
}
