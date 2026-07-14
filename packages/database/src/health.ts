import type { DatabaseConnection } from './client.js';

export interface HealthResult {
  readonly healthy: boolean;
  readonly latencyMs: number;
  readonly error?: string;
}

export async function checkHealth(connection: DatabaseConnection): Promise<HealthResult> {
  const start = Date.now();
  try {
    const result = await connection.pool.query('SELECT 1 as ok');
    if (result.rows[0]?.ok === 1) {
      return { healthy: true, latencyMs: Date.now() - start };
    }
    return { healthy: false, latencyMs: Date.now() - start, error: 'Unexpected health check result' };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
