import { readFileSync, existsSync } from 'node:fs';
import { loadDatabaseConfig } from '@pte-app/database';
import { resetTestDatabase } from '@pte-app/database/testing/setup';
import { STATE_PATH, type E2EState } from './global-setup';

function loadState(): E2EState | null {
  if (!existsSync(STATE_PATH)) return null;
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
}

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
  if (isAlive(pid)) {
    console.error(`  ✗ ${label} (PID ${pid}) could not be stopped`);
  } else {
    console.log(`  ✓ ${label} (PID ${pid}) stopped`);
  }
}

async function main(): Promise<void> {
  console.log('Tearing down E2E services...');
  const state = loadState();
  if (state) {
    await stopProcess(state.apiPid, 'API');
    await stopProcess(state.webPid, 'Web');
  }
  try {
    const baseConfig = loadDatabaseConfig();
    await resetTestDatabase(baseConfig);
    console.log('  ✓ Test database reset');
  } catch (err) {
    console.error('  ✗ Failed to reset test database:', err);
  }
}

export default main;
