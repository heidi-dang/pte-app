import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadDatabaseConfig } from '@pte-app/database';
import { resetTestDatabase } from '@pte-app/database/testing/setup';

const PIDS_PATH = resolve(process.cwd(), '.local-runtime', 'pids.json');

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopProcess(pid: number, label: string): Promise<void> {
  if (!isAlive(pid)) {
    console.log(`  — ${label} (PID ${pid}) already exited`);
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 5000);
    const check = setInterval(() => {
      if (!isAlive(pid)) {
        clearTimeout(timer);
        clearInterval(check);
        resolve();
      }
    }, 200);
  });
  if (isAlive(pid)) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // ignore
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('Tearing down E2E services...');
  if (existsSync(PIDS_PATH)) {
    try {
      const pids = JSON.parse(readFileSync(PIDS_PATH, 'utf-8'));
      const apiPid = pids.api?.pid;
      const webPid = pids.web?.pid;
      if (apiPid) await stopProcess(apiPid, 'API');
      if (webPid) await stopProcess(webPid, 'Web');
    } catch {
      // ignore
    }
  }
  try {
    const baseConfig = loadDatabaseConfig();
    await resetTestDatabase(baseConfig);
    console.log('  ✓ Test database reset');
  } catch (err) {
    console.error('  ✗ Failed to reset test database:', err);
  }
  try {
    if (existsSync(PIDS_PATH)) unlinkSync(PIDS_PATH);
  } catch {
    /* ignore */
  }
  console.log('E2E teardown complete.');
}

export default main;
