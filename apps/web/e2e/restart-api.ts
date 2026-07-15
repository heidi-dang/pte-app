import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { loadEnvLocal } from '@pte-app/database/testing/env';

const PIDS_PATH = resolve(process.cwd(), '.local-runtime/pids.json');

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForUrl(url: string, timeoutMs: number, expectedOk: boolean): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (expectedOk && res.ok) return true;
      if (!expectedOk && !res.ok) return true;
    } catch {
      if (!expectedOk) return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

export async function restartApi(apiUrl: string): Promise<number> {
  const testDbName = process.env.E2E_DATABASE_NAME;
  if (!testDbName) throw new Error('E2E_DATABASE_NAME is not set in environment');

  let oldPid: number | undefined;
  if (existsSync(PIDS_PATH)) {
    try {
      const pids = JSON.parse(readFileSync(PIDS_PATH, 'utf-8'));
      oldPid = pids.api?.pid;
    } catch {
      // ignore
    }
  }

  if (oldPid && isAlive(oldPid)) {
    try {
      process.kill(-oldPid, 'SIGTERM');
    } catch {
      process.kill(oldPid, 'SIGTERM');
    }
    const stopped = await waitForUrl(`${apiUrl}/health/live`, 10000, false);
    if (!stopped) throw new Error(`API (PID ${oldPid}) did not stop after SIGTERM`);
    if (isAlive(oldPid)) {
      try {
        process.kill(-oldPid, 'SIGKILL');
      } catch {
        process.kill(oldPid, 'SIGKILL');
      }
    }
  }

  const apiPort = new URL(apiUrl).port;
  const env = loadEnvLocal();
  const serviceEnv = {
    ...env,
    ...process.env,
    API_HOST: '127.0.0.1',
    API_PORT: apiPort,
    POSTGRES_DATABASE: testDbName,
    NEXT_PUBLIC_API_URL: apiUrl,
  };
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', 'start'], {
    cwd: resolve(process.cwd(), '../../services/api'),
    stdio: 'pipe',
    env: serviceEnv,
    detached: true,
  });

  child.stdout?.on('data', (d: Buffer) => process.stdout.write(`[api-restart] ${d}`));
  child.stderr?.on('data', (d: Buffer) => process.stderr.write(`[api-restart] ${d}`));

  const started = await waitForUrl(`${apiUrl}/health/live`, 30000, true);
  if (!started) {
    child.kill('SIGKILL');
    throw new Error(
      `API did not restart at ${apiUrl} (pid ${child.pid ?? 'unknown'}, exit code ${child.exitCode ?? 'N/A'}, signal ${child.signalCode ?? 'N/A'})`,
    );
  }
  if (child.pid == null) throw new Error('Restarted API has no PID');

  // Update PID record for teardown
  if (existsSync(PIDS_PATH)) {
    try {
      const pids = JSON.parse(readFileSync(PIDS_PATH, 'utf-8'));
      pids.api = { pid: child.pid, service: 'api', port: apiPort, startedAt: new Date().toISOString() };
      writeFileSync(PIDS_PATH, JSON.stringify(pids, null, 2));
    } catch {
      // ignore
    }
  }

  return child.pid;
}
