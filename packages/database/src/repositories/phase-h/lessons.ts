import type { DatabaseConnection } from '../../client.js';
import type { CourseId, CourseModuleId, LessonId, LessonRecord } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateLessonInput {
  readonly moduleId: CourseModuleId;
  readonly courseId: CourseId;
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly orderPosition: number;
  readonly isOptional: boolean;
  readonly estimatedMinutes: number;
  readonly createdBy: string;
}

export interface UpdateLessonInput {
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly orderPosition?: number;
  readonly isOptional?: boolean;
  readonly estimatedMinutes?: number;
}

export async function createLesson(connection: DatabaseConnection, input: CreateLessonInput): Promise<LessonRecord> {
  const id = randomUUID() as LessonId;

  const slugCheck = await connection.pool.query<Record<string, unknown>>(`SELECT id FROM lessons WHERE slug = $1`, [
    input.slug,
  ]);
  if (slugCheck.rows.length > 0) {
    throw new Error(`Lesson with slug "${input.slug}" already exists`);
  }

  const orderCheck = await connection.pool.query<Record<string, unknown>>(
    `SELECT id FROM lessons WHERE module_id = $1 AND order_position = $2`,
    [input.moduleId, input.orderPosition],
  );
  if (orderCheck.rows.length > 0) {
    throw new Error(`Lesson at order position ${input.orderPosition} already exists in module ${input.moduleId}`);
  }

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lessons (id, module_id, course_id, title, slug, summary, order_position,
      is_optional, estimated_minutes, status, version, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', 1, $10)
     RETURNING id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
       order_position as "orderPosition", is_optional as "isOptional",
       estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt"`,
    [
      id,
      input.moduleId,
      input.courseId,
      input.title,
      input.slug,
      input.summary,
      input.orderPosition,
      input.isOptional,
      input.estimatedMinutes,
      input.createdBy,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create lesson');
  return row as unknown as LessonRecord;
}

export async function getLessonById(connection: DatabaseConnection, id: LessonId): Promise<LessonRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
      order_position as "orderPosition", is_optional as "isOptional",
      estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt"
     FROM lessons WHERE id = $1`,
    [id],
  );
  return result.rows[0] as unknown as LessonRecord | undefined;
}

export async function getLessonBySlug(connection: DatabaseConnection, slug: string): Promise<LessonRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
      order_position as "orderPosition", is_optional as "isOptional",
      estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt"
     FROM lessons WHERE slug = $1`,
    [slug],
  );
  return result.rows[0] as unknown as LessonRecord | undefined;
}

export async function listLessonsForModule(
  connection: DatabaseConnection,
  moduleId: CourseModuleId,
): Promise<LessonRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
      order_position as "orderPosition", is_optional as "isOptional",
      estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt"
     FROM lessons WHERE module_id = $1
     ORDER BY order_position ASC`,
    [moduleId],
  );
  return result.rows as unknown as LessonRecord[];
}

export async function updateLesson(
  connection: DatabaseConnection,
  id: LessonId,
  input: UpdateLessonInput,
): Promise<LessonRecord | undefined> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    sets.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.slug !== undefined) {
    sets.push(`slug = $${index++}`);
    values.push(input.slug);
  }
  if (input.summary !== undefined) {
    sets.push(`summary = $${index++}`);
    values.push(input.summary);
  }
  if (input.orderPosition !== undefined) {
    sets.push(`order_position = $${index++}`);
    values.push(input.orderPosition);
  }
  if (input.isOptional !== undefined) {
    sets.push(`is_optional = $${index++}`);
    values.push(input.isOptional);
  }
  if (input.estimatedMinutes !== undefined) {
    sets.push(`estimated_minutes = $${index++}`);
    values.push(input.estimatedMinutes);
  }

  if (sets.length === 0) return getLessonById(connection, id);

  sets.push(`version = version + 1`);
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE lessons SET ${sets.join(', ')} WHERE id = $${index}
     RETURNING id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
       order_position as "orderPosition", is_optional as "isOptional",
       estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] as unknown as LessonRecord | undefined;
}

export async function publishLesson(connection: DatabaseConnection, id: LessonId): Promise<LessonRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE lessons SET status = 'published', version = version + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
       order_position as "orderPosition", is_optional as "isOptional",
       estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt"`,
    [id],
  );
  return result.rows[0] as unknown as LessonRecord | undefined;
}

export async function retireLesson(connection: DatabaseConnection, id: LessonId): Promise<LessonRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE lessons SET status = 'retired', version = version + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING id, module_id as "moduleId", course_id as "courseId", title, slug, summary,
       order_position as "orderPosition", is_optional as "isOptional",
       estimated_minutes as "estimatedMinutes", quiz_id as "quizId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt"`,
    [id],
  );
  return result.rows[0] as unknown as LessonRecord | undefined;
}
