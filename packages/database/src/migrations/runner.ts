import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DatabaseConnection } from '../client.js';
import { applyMigrations, type Migration } from './journal.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadMigration(version: string, name: string): Promise<Migration> {
  const sql = readFileSync(join(__dirname, `${version}_${name}.sql`), 'utf-8');
  return { version, name, sql };
}

export async function loadMigrations(): Promise<Migration[]> {
  return [
    await loadMigration('0001', 'initial'),
    await loadMigration('0002', 'content_provenance'),
    await loadMigration('0003', 'provenance_ext'),
    await loadMigration('0005', 'phase_h'),
    await loadMigration('0006', 'phase_h_entitlements'),
    await loadMigration('0007', 'phase_h_version_status'),
    await loadMigration('0008', 'phase_i'),
    await loadMigration('0009', 'phase_i_max_plays_check'),
    await loadMigration('0010', 'phase_l_speaking_recordings'),
  ];
}

export async function runMigrations(
  connection: DatabaseConnection,
  options: { dryRun?: boolean; onProgress?: (version: string) => void } = {},
): Promise<void> {
  const migrations = await loadMigrations();
  await applyMigrations(connection, migrations, options);
}
