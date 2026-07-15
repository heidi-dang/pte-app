import { readFileSync, existsSync } from 'node:fs';
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
    if (!stopped) throw new Error('API did not stop after SIGTERM');
    if (isAlive(oldPid)) {
      try {
        process.kill(-oldPid, 'SIGKILL');
      } catch {
        process.kill(oldPid, 'SIGKILL');
      }
    }
  }

  const env = loadEnvLocal();
  const serviceEnv = { ...process.env, ...env, API_PORT: String(new URL(apiUrl).port), API_HOST: '127.0.0.1' };
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

  return child.pid;
}
