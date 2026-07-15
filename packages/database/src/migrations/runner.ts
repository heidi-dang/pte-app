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
    await loadMigration('0004', 'question_engine'),
    await loadMigration('0005', 'speaking_recordings'),
    await loadMigration('0006', 'objective_scoring'),
    await loadMigration('0007', 'open_response_evaluation'),
    await loadMigration('0008', 'diagnostics_study_plans'),
    await loadMigration('0009', 'mock_exam_engine'),
    await loadMigration('0010', 'reporting_and_mastery'),
    await loadMigration('0011', 'teacher_and_admin_portals'),
    await loadMigration('0012', 'content_production_factory'),
    await loadMigration('0013', 'calibration_and_validation'),
    await loadMigration('0014', 'notifications_support_operations'),
  ];
}

export async function runMigrations(
  connection: DatabaseConnection,
  options: { dryRun?: boolean; onProgress?: (version: string) => void } = {},
): Promise<void> {
  const migrations = await loadMigrations();
  await applyMigrations(connection, migrations, options);
}
