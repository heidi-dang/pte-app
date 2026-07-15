import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { loadEnvLocal, applyEnvLocal } from '@pte-app/database/testing/env';
import { loadDatabaseConfig, createConnection, type DatabaseConnection } from '@pte-app/database';
import { setupTestDatabase, resetTestDatabase } from '@pte-app/database/testing/setup';

applyEnvLocal();

export interface TestHarness {
  db: DatabaseConnection;
  apiUrl: string;
  stop: () => Promise<void>;
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForUrl(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return true;
    } catch {
      // ignore transient health check failures
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

export async function startTestHarness(): Promise<TestHarness> {
  const env = loadEnvLocal();
  const baseConfig = loadDatabaseConfig();
  const testDbName = `${baseConfig.database}_test`;

  await setupTestDatabase(baseConfig);

  const apiPort = await getAvailablePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;

  const testEnv = {
    ...process.env,
    ...env,
    POSTGRES_DATABASE: testDbName,
    API_PORT: String(apiPort),
    API_HOST: '127.0.0.1',
    NODE_ENV: 'test',
  };

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child: ChildProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: new URL('../../../', import.meta.url).pathname,
    stdio: 'pipe',
    env: testEnv,
    detached: true,
  });

  const ready = await waitForUrl(`${apiUrl}/health/live`, 30000);
  if (!ready) {
    child.kill('SIGKILL');
    throw new Error(`API did not become ready at ${apiUrl}`);
  }

  const testDbConfig = { ...baseConfig, database: testDbName };
  const db = await createConnection(testDbConfig);

  return {
    db,
    apiUrl,
    stop: async () => {
      try {
        await fetch(`${apiUrl}/health/live`);
      } catch {
        // ignore pre-shutdown probe failure
      }
      if (child.pid != null) {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          child.kill('SIGTERM');
        }
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 5000);
          child.once('exit', () => {
            clearTimeout(timer);
            resolve();
          });
        });
        if (child.exitCode === null && child.pid != null) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            child.kill('SIGKILL');
          }
        }
      }
      await resetTestDatabase(baseConfig).catch(() => {});
      await db.close();
    },
  };
}
