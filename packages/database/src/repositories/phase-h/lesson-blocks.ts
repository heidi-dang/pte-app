import type { DatabaseConnection } from '../../client.js';
import type { LessonId, LessonVersionId, LessonBlockId, LessonBlockType, LessonBlockRecord } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateLessonBlockInput {
  readonly lessonId: LessonId;
  readonly lessonVersionId: LessonVersionId;
  readonly blockType: LessonBlockType;
  readonly orderPosition: number;
  readonly title: string;
  readonly content: Record<string, unknown>;
}

export interface UpdateLessonBlockInput {
  readonly content?: Record<string, unknown>;
  readonly title?: string;
  readonly blockType?: LessonBlockType;
  readonly orderPosition?: number;
}

export async function createLessonBlock(
  connection: DatabaseConnection,
  input: CreateLessonBlockInput,
): Promise<LessonBlockRecord> {
  const id = randomUUID() as LessonBlockId;

  const existing = await connection.pool.query<Record<string, unknown>>(
    `SELECT id FROM lesson_blocks WHERE lesson_version_id = $1 AND order_position = $2`,
    [input.lessonVersionId, input.orderPosition],
  );
  if (existing.rows.length > 0) {
    throw new Error(
      `Block at order position ${input.orderPosition} already exists for lesson version ${input.lessonVersionId}`,
    );
  }

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_blocks (id, lesson_id, lesson_version_id, block_type, order_position, title, content)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, lesson_id as "lessonId", lesson_version_id as "lessonVersionId",
       block_type as "blockType", order_position as "orderPosition", title, content,
       created_at as "createdAt", updated_at as "updatedAt"`,
    [
      id,
      input.lessonId,
      input.lessonVersionId,
      input.blockType,
      input.orderPosition,
      input.title,
      JSON.stringify(input.content),
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create lesson block');
  return row as unknown as LessonBlockRecord;
}

export async function getLessonBlocks(
  connection: DatabaseConnection,
  lessonVersionId: LessonVersionId,
): Promise<LessonBlockRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, lesson_id as "lessonId", lesson_version_id as "lessonVersionId",
      block_type as "blockType", order_position as "orderPosition", title, content,
      created_at as "createdAt", updated_at as "updatedAt"
     FROM lesson_blocks WHERE lesson_version_id = $1
     ORDER BY order_position ASC`,
    [lessonVersionId],
  );
  return result.rows as unknown as LessonBlockRecord[];
}

export async function updateLessonBlock(
  connection: DatabaseConnection,
  id: LessonBlockId,
  input: UpdateLessonBlockInput,
): Promise<LessonBlockRecord | undefined> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.content !== undefined) {
    sets.push(`content = $${index++}`);
    values.push(JSON.stringify(input.content));
  }
  if (input.title !== undefined) {
    sets.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.blockType !== undefined) {
    sets.push(`block_type = $${index++}`);
    values.push(input.blockType);
  }
  if (input.orderPosition !== undefined) {
    sets.push(`order_position = $${index++}`);
    values.push(input.orderPosition);
  }

  if (sets.length === 0) {
    const blocks = await connection.pool.query<Record<string, unknown>>(
      `SELECT id, lesson_id as "lessonId", lesson_version_id as "lessonVersionId",
        block_type as "blockType", order_position as "orderPosition", title, content,
        created_at as "createdAt", updated_at as "updatedAt"
       FROM lesson_blocks WHERE id = $1`,
      [id],
    );
    return (blocks.rows[0] as unknown as LessonBlockRecord | undefined) ?? undefined;
  }

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE lesson_blocks SET ${sets.join(', ')} WHERE id = $${index}
     RETURNING id, lesson_id as "lessonId", lesson_version_id as "lessonVersionId",
       block_type as "blockType", order_position as "orderPosition", title, content,
       created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] as unknown as LessonBlockRecord | undefined;
}

export async function deleteLessonBlock(connection: DatabaseConnection, id: LessonBlockId): Promise<boolean> {
  const result = await connection.pool.query('DELETE FROM lesson_blocks WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
