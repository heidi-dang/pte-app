import type { DatabaseConfig } from '../config.js';
import { createConnection } from '../client.js';
import { runMigrations } from '../migrations/runner.js';

export async function setupTestDatabase(config: DatabaseConfig): Promise<void> {
  const adminConfig: DatabaseConfig = { ...config, database: 'postgres' };
  const admin = await createConnection(adminConfig);
  try {
    const testDbName = `${config.database}_test`;
    await admin.pool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await admin.pool.query(`CREATE DATABASE ${testDbName}`);
  } finally {
    await admin.close();
  }
}

export async function resetTestDatabase(config: DatabaseConfig): Promise<void> {
  const testConfig: DatabaseConfig = { ...config, database: `${config.database}_test` };
  const connection = await createConnection(testConfig);
  try {
    await connection.pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    await connection.pool.query('DROP TABLE IF EXISTS migration_history CASCADE');
    await runMigrations(connection);
  } finally {
    await connection.close();
  }
}
