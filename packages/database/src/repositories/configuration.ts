import type { DatabaseConnection } from '../client.js';
import type { ConfigurationVersionRecord } from '../config.js';

export interface CreateConfigurationVersionInput {
  readonly id: string;
  readonly version: string;
  readonly status: string;
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly scope: string;
  readonly environment: string;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string | null;
  readonly source: string;
  readonly supersededBy?: string | null;
}

export async function createConfigurationVersion(
  connection: DatabaseConnection,
  input: CreateConfigurationVersionInput,
): Promise<ConfigurationVersionRecord> {
  const result = await connection.pool.query<ConfigurationVersionRecord>(
    `INSERT INTO configuration_versions (id, version, status, key, value, scope, environment, effective_from, effective_until, source, superseded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, version, status, key, value, scope, environment,
               effective_from as "effectiveFrom", effective_until as "effectiveUntil",
               source, superseded_by as "supersededBy", created_at as "createdAt"`,
    [
      input.id,
      input.version,
      input.status,
      input.key,
      JSON.stringify(input.value),
      input.scope,
      input.environment,
      input.effectiveFrom,
      input.effectiveUntil ?? null,
      input.source,
      input.supersededBy ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create configuration version');
  return row;
}

export async function getConfigurationVersionById(
  connection: DatabaseConnection,
  id: string,
): Promise<ConfigurationVersionRecord | undefined> {
  const result = await connection.pool.query<ConfigurationVersionRecord>(
    `SELECT id, version, status, key, value, scope, environment,
            effective_from as "effectiveFrom", effective_until as "effectiveUntil",
            source, superseded_by as "supersededBy", created_at as "createdAt"
     FROM configuration_versions
     WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}
