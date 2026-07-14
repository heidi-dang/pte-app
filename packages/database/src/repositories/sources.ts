import type { DatabaseConnection } from '../client.js';
import type { SourceRecord, SourceId, UserId, SourceType } from '@pte-app/contracts';

export async function createSource(
  connection: DatabaseConnection,
  input: {
    id: SourceId;
    sourceType: SourceType;
    title: string;
    owner: string;
    publisher: string;
    sourceUrl: string;
    jurisdiction: string;
    sourceDate: string;
    accessDate: string;
    description: string;
    createdBy: UserId;
  },
): Promise<SourceRecord> {
  const result = await connection.pool.query<SourceRecord>(
    `INSERT INTO content_sources (id, source_type, title, owner, publisher, source_url, jurisdiction, source_date, access_date, description, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11)
     RETURNING id, source_type as "sourceType", title, owner, publisher, source_url as "sourceUrl", jurisdiction,
               source_date as "sourceDate", access_date as "accessDate", description, status,
               evidence_ids as "evidenceIds", created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [
      input.id,
      input.sourceType,
      input.title,
      input.owner,
      input.publisher,
      input.sourceUrl,
      input.jurisdiction,
      input.sourceDate,
      input.accessDate,
      input.description,
      input.createdBy,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create source');
  return result.rows[0];
}

export async function getSourceById(connection: DatabaseConnection, id: SourceId): Promise<SourceRecord | undefined> {
  const result = await connection.pool.query<SourceRecord>(
    `SELECT id, source_type as "sourceType", title, owner, publisher, source_url as "sourceUrl", jurisdiction,
            source_date as "sourceDate", access_date as "accessDate", description, status,
            evidence_ids as "evidenceIds", created_by as "createdBy",
            created_at as "createdAt", updated_at as "updatedAt", version
     FROM content_sources WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}

export async function updateSource(
  connection: DatabaseConnection,
  id: SourceId,
  input: Partial<Omit<SourceRecord, 'id' | 'createdBy' | 'createdAt' | 'version'>>,
  expectedVersion: number,
): Promise<SourceRecord | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(input)) {
    const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    fields.push(`${col} = $${idx++}`);
    values.push(v);
  }
  if (fields.length === 0) return undefined;
  fields.push(`version = version + 1, updated_at = NOW()`);
  values.push(id, expectedVersion);
  const result = await connection.pool.query<SourceRecord>(
    `UPDATE content_sources SET ${fields.join(', ')} WHERE id = $${idx} AND version = $${idx + 1}
     RETURNING id, source_type as "sourceType", title, owner, publisher, source_url as "sourceUrl", jurisdiction,
               source_date as "sourceDate", access_date as "accessDate", description, status,
               evidence_ids as "evidenceIds", created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [...values, id, expectedVersion],
  );
  return result.rows[0];
}

export async function listSources(connection: DatabaseConnection): Promise<SourceRecord[]> {
  const result = await connection.pool.query<SourceRecord>(
    `SELECT id, source_type as "sourceType", title, owner, publisher, source_url as "sourceUrl", jurisdiction,
            source_date as "sourceDate", access_date as "accessDate", description, status,
            evidence_ids as "evidenceIds", created_by as "createdBy",
            created_at as "createdAt", updated_at as "updatedAt", version
     FROM content_sources ORDER BY created_at DESC`,
  );
  return result.rows;
}
