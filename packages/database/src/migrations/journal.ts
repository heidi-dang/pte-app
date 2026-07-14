import type { DatabaseConnection } from '../client.js';

export interface Migration {
  readonly version: string;
  readonly name: string;
  readonly sql: string;
}

export interface MigrationJournal {
  readonly version: string;
  readonly name: string;
  readonly appliedAt: string;
  readonly checksum: string;
}

export async function ensureJournalTable(connection: DatabaseConnection): Promise<void> {
  await connection.pool.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      version VARCHAR(32) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum VARCHAR(64) NOT NULL
    );
  `);
}

export async function getAppliedMigrations(connection: DatabaseConnection): Promise<MigrationJournal[]> {
  await ensureJournalTable(connection);
  const result = await connection.pool.query<MigrationJournal>(`
    SELECT version, name, applied_at as "appliedAt", checksum
    FROM migration_history
    ORDER BY id ASC
  `);
  return result.rows;
}

export function computeChecksum(sql: string): string {
  let hash = 0;
  for (let i = 0; i < sql.length; i++) {
    const char = sql.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export async function applyMigration(
  connection: DatabaseConnection,
  migration: Migration,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  await ensureJournalTable(connection);

  const applied = await connection.pool.query<{ checksum: string }>(
    'SELECT checksum FROM migration_history WHERE version = $1',
    [migration.version],
  );

  const checksum = computeChecksum(migration.sql);

  const existing = applied.rows[0];
  if (existing) {
    if (existing.checksum !== checksum) {
      throw new Error(`Migration ${migration.version} checksum mismatch`);
    }
    return;
  }

  if (options.dryRun) {
    return;
  }

  await connection.pool.query('BEGIN');
  try {
    await connection.pool.query(migration.sql);
    await connection.pool.query('INSERT INTO migration_history (version, name, checksum) VALUES ($1, $2, $3)', [
      migration.version,
      migration.name,
      checksum,
    ]);
    await connection.pool.query('COMMIT');
  } catch (err) {
    await connection.pool.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

export async function applyMigrations(
  connection: DatabaseConnection,
  migrations: Migration[],
  options: { dryRun?: boolean; onProgress?: (version: string) => void } = {},
): Promise<void> {
  for (const migration of migrations) {
    if (options.onProgress) options.onProgress(migration.version);
    await applyMigration(connection, migration, { dryRun: options.dryRun });
  }
}
