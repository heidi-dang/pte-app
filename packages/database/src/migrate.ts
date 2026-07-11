/**
 * Migration runner.
 *
 * Reads migration files from src/migrations/ and runs them in order.
 * Tracks applied migrations in a _migrations table.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getConnection, createConnection } from './connection.js';

export interface Migration {
  readonly version: string;
  readonly name: string;
  readonly sql: string;
}

function loadMigrations(migrationsDir: string): Migration[] {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) throw new Error(`Invalid migration filename: ${file} — expected NNN_name.sql`);
    return {
      version: match[1]!.padStart(3, '0'),
      name: match[2]!,
      sql: readFileSync(join(migrationsDir, file), 'utf-8'),
    };
  });
}

async function ensureMigrationsTable(): Promise<void> {
  const conn = getConnection();
  await conn`
    CREATE TABLE IF NOT EXISTS _migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedVersions(): Promise<Set<string>> {
  const conn = getConnection();
  const rows = await conn`SELECT version FROM _migrations ORDER BY version`;
  return new Set(rows.map((r: Record<string, unknown>) => String(r.version)));
}

export async function runMigrations(migrationsDir?: string): Promise<void> {
  const dir = migrationsDir ?? join(dirname(new URL(import.meta.url).pathname), 'migrations');
  const migrations = loadMigrations(dir);

  if (migrations.length === 0) {
    console.log('No migrations found.');
    return;
  }

  await ensureMigrationsTable();
  const applied = await getAppliedVersions();
  const conn = getConnection();

  for (const migration of migrations) {
    if (applied.has(migration.version)) {
      console.log(`  \u2713 ${migration.version}_${migration.name} (already applied)`);
      continue;
    }

    console.log(`  \u2192 ${migration.version}_${migration.name}...`);
    await conn.unsafe(migration.sql);

    await conn`
      INSERT INTO _migrations (version, name) VALUES (${migration.version}, ${migration.name})
    `;

    console.log(`  \u2713 applied`);
  }
}

// CLI usage: tsx src/migrate.ts
const isMain = process.argv[1]?.includes('migrate');
if (isMain) {
  // @ts-expect-error - local-env.mjs has no declaration file but works at runtime
  const { loadEnvLocal } = await import('../../../scripts/lib/local-env.mjs');
  const env = loadEnvLocal();
  createConnection({
    host: env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(env.POSTGRES_PORT || '5432', 10),
    database: env.POSTGRES_DATABASE || 'pte_app',
    user: env.POSTGRES_USER || 'pte_app',
    password: env.POSTGRES_PASSWORD || '',
  });
  await runMigrations().catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
}
