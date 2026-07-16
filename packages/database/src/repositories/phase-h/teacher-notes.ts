import type { DatabaseConnection } from '../../client.js';
import type { TeacherNoteId, TeacherNoteRecord } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateTeacherNoteInput {
  readonly entityType: 'course' | 'module' | 'lesson';
  readonly entityId: string;
  readonly content: string;
  readonly authorId: string;
}

export interface UpdateTeacherNoteInput {
  readonly content: string;
}

export async function createTeacherNote(
  connection: DatabaseConnection,
  input: CreateTeacherNoteInput,
): Promise<TeacherNoteRecord> {
  const id = randomUUID() as TeacherNoteId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO teacher_notes (id, entity_type, entity_id, content, author_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, entity_type as "entityType", entity_id as "entityId", content,
       author_id as "authorId", created_at as "createdAt", updated_at as "updatedAt"`,
    [id, input.entityType, input.entityId, input.content, input.authorId],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create teacher note');
  return row as unknown as TeacherNoteRecord;
}

export async function getTeacherNotes(
  connection: DatabaseConnection,
  entityType: 'course' | 'module' | 'lesson',
  entityId: string,
): Promise<TeacherNoteRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, entity_type as "entityType", entity_id as "entityId", content,
      author_id as "authorId", created_at as "createdAt", updated_at as "updatedAt"
     FROM teacher_notes WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC`,
    [entityType, entityId],
  );
  return result.rows as unknown as TeacherNoteRecord[];
}

export async function updateTeacherNote(
  connection: DatabaseConnection,
  id: TeacherNoteId,
  input: UpdateTeacherNoteInput,
): Promise<TeacherNoteRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE teacher_notes SET content = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, entity_type as "entityType", entity_id as "entityId", content,
       author_id as "authorId", created_at as "createdAt", updated_at as "updatedAt"`,
    [input.content, id],
  );
  return result.rows[0] as unknown as TeacherNoteRecord | undefined;
}

export async function deleteTeacherNote(connection: DatabaseConnection, id: TeacherNoteId): Promise<boolean> {
  const result = await connection.pool.query('DELETE FROM teacher_notes WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
