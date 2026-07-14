import pg from 'pg';
import type { DatabaseConfig } from './config.js';

const { Pool } = pg;

export type DatabaseClient = pg.PoolClient;

export interface DatabaseConnection {
  readonly pool: pg.Pool;
  readonly config: DatabaseConfig;
  close(): Promise<void>;
}

export async function createConnection(
  config: DatabaseConfig,
  onRetry?: (attempt: number) => void,
): Promise<DatabaseConnection> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: config.maxConnections,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
  });

  let lastError: unknown;
  let ended = false;
  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return {
        pool,
        config,
        async close() {
          if (ended) return;
          ended = true;
          await pool.end();
        },
      };
    } catch (err) {
      lastError = err;
      if (onRetry) onRetry(attempt);
      if (attempt < config.retryAttempts) {
        await delay(config.retryDelayMs);
      }
    }
  }

  await pool.end();
  throw new Error(
    `Failed to connect to PostgreSQL at ${config.host}:${config.port}/${config.database} after ${config.retryAttempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

export async function createTestConnection(config: DatabaseConfig): Promise<DatabaseConnection> {
  const testConfig: DatabaseConfig = {
    ...config,
    database: `${config.database}_test`,
  };
  return createConnection(testConfig);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
