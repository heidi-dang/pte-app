import type { DatabaseConnection } from '../../client.js';
import type { CourseId, CourseAccessLevel, CourseRecord, CourseCatalogueResult } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateCourseInput {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly accessLevel: CourseAccessLevel;
  readonly difficulty: string;
  readonly estimatedDurationMinutes: number;
  readonly skillTags: readonly string[];
  readonly thumbnailMediaId: string | null;
  readonly createdBy: string;
}

export interface UpdateCourseInput {
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly accessLevel?: CourseAccessLevel;
  readonly difficulty?: string;
  readonly estimatedDurationMinutes?: number;
  readonly skillTags?: readonly string[];
  readonly thumbnailMediaId?: string | null;
}

export interface SearchCoursesInput {
  readonly searchText?: string;
  readonly accessLevel?: CourseAccessLevel;
  readonly difficulty?: string;
  readonly pageSize?: number;
  readonly cursor?: string;
}

export async function createCourse(connection: DatabaseConnection, input: CreateCourseInput): Promise<CourseRecord> {
  const id = randomUUID() as CourseId;
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO courses (id, slug, title, summary, description, access_level, difficulty,
      estimated_duration_minutes, skill_tags, thumbnail_media_id, status, version, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', 1, $11)
     RETURNING id, slug, title, summary, description, access_level as "accessLevel",
       difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
       skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt", published_at as "publishedAt"`,
    [
      id,
      input.slug,
      input.title,
      input.summary,
      input.description,
      input.accessLevel,
      input.difficulty,
      input.estimatedDurationMinutes,
      JSON.stringify(input.skillTags),
      input.thumbnailMediaId,
      input.createdBy,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create course');
  return row as unknown as CourseRecord;
}

export async function getCourseById(connection: DatabaseConnection, id: CourseId): Promise<CourseRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, slug, title, summary, description, access_level as "accessLevel",
      difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
      skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt", published_at as "publishedAt"
     FROM courses WHERE id = $1`,
    [id],
  );
  return result.rows[0] as unknown as CourseRecord | undefined;
}

export async function getCourseBySlug(connection: DatabaseConnection, slug: string): Promise<CourseRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, slug, title, summary, description, access_level as "accessLevel",
      difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
      skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt", published_at as "publishedAt"
     FROM courses WHERE slug = $1`,
    [slug],
  );
  return result.rows[0] as unknown as CourseRecord | undefined;
}

export async function listPublishedCourses(
  connection: DatabaseConnection,
  pageSize?: number,
  cursor?: string,
): Promise<CourseCatalogueResult> {
  const limit = pageSize ?? 20;
  const values: unknown[] = [];
  let whereClause = "WHERE status = 'published'";
  let index = 1;

  if (cursor) {
    whereClause += ` AND created_at < $${index++}`;
    values.push(cursor);
  }

  values.push(limit + 1);

  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, slug, title, summary, description, access_level as "accessLevel",
      difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
      skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt", published_at as "publishedAt"
     FROM courses ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${index}`,
    values,
  );

  const rows = result.rows as unknown as CourseRecord[];
  const hasMore = rows.length > limit;
  const courses = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (courses[courses.length - 1]?.createdAt ?? null) : null;

  return {
    courses,
    totalCount: courses.length,
    nextCursor,
    hasMore,
  };
}

export async function searchCourses(
  connection: DatabaseConnection,
  input: SearchCoursesInput,
): Promise<CourseCatalogueResult> {
  const limit = input.pageSize ?? 20;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.searchText) {
    conditions.push(
      `to_tsvector('english', title || ' ' || summary || ' ' || description) @@ plainto_tsquery('english', $${index++})`,
    );
    values.push(input.searchText);
  }

  if (input.accessLevel) {
    conditions.push(`access_level = $${index++}`);
    values.push(input.accessLevel);
  }

  if (input.difficulty) {
    conditions.push(`difficulty = $${index++}`);
    values.push(input.difficulty);
  }

  if (input.cursor) {
    conditions.push(`created_at < $${index++}`);
    values.push(input.cursor);
  }

  conditions.push(`status = 'published'`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(limit + 1);

  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, slug, title, summary, description, access_level as "accessLevel",
      difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
      skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
      status, version, created_by as "createdBy", created_at as "createdAt",
      updated_at as "updatedAt", published_at as "publishedAt"
     FROM courses ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${index}`,
    values,
  );

  const rows = result.rows as unknown as CourseRecord[];
  const hasMore = rows.length > limit;
  const courses = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (courses[courses.length - 1]?.createdAt ?? null) : null;

  return {
    courses,
    totalCount: courses.length,
    nextCursor,
    hasMore,
  };
}

export async function updateCourse(
  connection: DatabaseConnection,
  id: CourseId,
  input: UpdateCourseInput,
): Promise<CourseRecord | undefined> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.slug !== undefined) {
    sets.push(`slug = $${index++}`);
    values.push(input.slug);
  }
  if (input.title !== undefined) {
    sets.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.summary !== undefined) {
    sets.push(`summary = $${index++}`);
    values.push(input.summary);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${index++}`);
    values.push(input.description);
  }
  if (input.accessLevel !== undefined) {
    sets.push(`access_level = $${index++}`);
    values.push(input.accessLevel);
  }
  if (input.difficulty !== undefined) {
    sets.push(`difficulty = $${index++}`);
    values.push(input.difficulty);
  }
  if (input.estimatedDurationMinutes !== undefined) {
    sets.push(`estimated_duration_minutes = $${index++}`);
    values.push(input.estimatedDurationMinutes);
  }
  if (input.skillTags !== undefined) {
    sets.push(`skill_tags = $${index++}`);
    values.push(JSON.stringify(input.skillTags));
  }
  if (input.thumbnailMediaId !== undefined) {
    sets.push(`thumbnail_media_id = $${index++}`);
    values.push(input.thumbnailMediaId);
  }

  if (sets.length === 0) return getCourseById(connection, id);

  sets.push(`version = version + 1`);
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE courses SET ${sets.join(', ')} WHERE id = $${index}
     RETURNING id, slug, title, summary, description, access_level as "accessLevel",
       difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
       skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt", published_at as "publishedAt"`,
    values,
  );
  return result.rows[0] as unknown as CourseRecord | undefined;
}

export async function publishCourse(connection: DatabaseConnection, id: CourseId): Promise<CourseRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE courses SET status = 'published', published_at = NOW(), version = version + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING id, slug, title, summary, description, access_level as "accessLevel",
       difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
       skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt", published_at as "publishedAt"`,
    [id],
  );
  return result.rows[0] as unknown as CourseRecord | undefined;
}

export async function retireCourse(connection: DatabaseConnection, id: CourseId): Promise<CourseRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE courses SET status = 'retired', version = version + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING id, slug, title, summary, description, access_level as "accessLevel",
       difficulty, estimated_duration_minutes as "estimatedDurationMinutes",
       skill_tags as "skillTags", thumbnail_media_id as "thumbnailMediaId",
       status, version, created_by as "createdBy", created_at as "createdAt",
       updated_at as "updatedAt", published_at as "publishedAt"`,
    [id],
  );
  return result.rows[0] as unknown as CourseRecord | undefined;
}
