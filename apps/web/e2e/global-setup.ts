import { spawn, type ChildProcess } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal, applyEnvLocal } from '@pte-app/database/testing/env';
import { loadDatabaseConfig } from '@pte-app/database';
import { setupTestDatabase } from '@pte-app/database/testing/setup';

applyEnvLocal();

function getRequiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Required environment variable ${key} is not set`);
  return val;
}

function waitForUrl(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = async () => {
      if (Date.now() - start >= timeoutMs) return resolve(false);
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
        if (res.ok) return resolve(true);
      } catch {
        // ignore transient failures
      }
      setTimeout(check, 250);
    };
    check();
  });
}

function spawnService(
  name: string,
  cwd: string,
  command: string,
  args: string[],
  env: Record<string, string>,
): ChildProcess {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, [command, ...args], { cwd, stdio: 'inherit', env: env as any, detached: true });
  return child;
}

async function main(): Promise<void> {
  const apiUrl = getRequiredEnv('E2E_API_URL');
  const webUrl = getRequiredEnv('E2E_WEB_URL');
  const testDbName = getRequiredEnv('E2E_DATABASE_NAME');

  console.log(`E2E API: ${apiUrl}`);
  console.log(`E2E Web: ${webUrl}`);
  console.log(`E2E DB: ${testDbName}`);

  const baseConfig = loadDatabaseConfig();
  await setupTestDatabase(baseConfig);

  const env = loadEnvLocal();
  const serviceEnv = { ...env, ...process.env, POSTGRES_DATABASE: testDbName, NODE_ENV: 'test' };

  const root = process.cwd();
  const api = spawnService('api', resolve(root, '../../services/api'), 'run', ['start'], serviceEnv);
  if (!(await waitForUrl(`${apiUrl}/health/live`, 30000))) {
    api.kill('SIGKILL');
    throw new Error(`API did not start at ${apiUrl}`);
  }

  const web = spawnService('web', resolve(root, '.'), 'run', ['start'], serviceEnv);
  if (!(await waitForUrl(webUrl, 60000))) {
    api.kill('SIGKILL');
    web.kill('SIGKILL');
    throw new Error(`Web did not start at ${webUrl}`);
  }

  const runtimeDir = resolve(process.cwd(), '.local-runtime');
  if (!existsSync(runtimeDir)) mkdirSync(runtimeDir, { recursive: true });
  writeFileSync(
    resolve(runtimeDir, 'pids.json'),
    JSON.stringify({
      api: { pid: api.pid, service: 'api', port: new URL(apiUrl).port },
      web: { pid: web.pid, service: 'web', port: new URL(webUrl).port },
    }),
  );
}

export default main;
