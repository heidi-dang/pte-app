#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { execSync } from 'child_process';
import { loadEnvLocal } from './lib/local-env.mjs';

const env = loadEnvLocal();
const pidsPath = '.local-runtime/pids.json';
let failures = 0;

async function stopProcess(pid, name) {
  const num = parseInt(pid, 10);
  if (isNaN(num) || num <= 0) {
    console.error(`  \u2717 Invalid PID for ${name}: ${pid}`);
    failures++;
    return;
  }

  try {
    process.kill(num, 0);
  } catch {
    console.log(`  \u2014 ${name} (PID ${num}) not running`);
    return;
  }

  try {
    process.kill(num, 'SIGTERM');
    const start = Date.now();
    let alive = true;
    while (Date.now() - start < 5000 && alive) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        process.kill(num, 0);
      } catch {
        alive = false;
      }
    }
    if (alive) {
      try {
        process.kill(num, 'SIGKILL');
        await new Promise((r) => setTimeout(r, 500));
      } catch {}
    }
    console.log(`  \u2713 ${name} (PID ${num}) stopped`);
  } catch (e) {
    console.error(`  \u2717 ${name} (PID ${num}) could not be stopped: ${e.message}`);
    failures++;
  }
}

async function main() {
  console.log('Tearing down local environment...');

  if (existsSync(pidsPath)) {
    let pids;
    try {
      pids = JSON.parse(readFileSync(pidsPath, 'utf-8'));
    } catch {
      console.error('  \u2717 Failed to parse pids.json');
      failures++;
      pids = {};
    }

    for (const [name, pid] of Object.entries(pids)) {
      await stopProcess(pid, name);
    }

    try {
      rmSync(pidsPath);
      console.log('  \u2713 PID state removed');
    } catch (e) {
      console.error(`  \u2717 Failed to remove PID state: ${e.message}`);
      failures++;
    }
  } else {
    console.log('  \u2014 No PID file found (already clean)');
  }

  if (existsSync('.local-runtime')) {
    try {
      const entries = readdirSync('.local-runtime');
      const remaining = entries.filter((e) => e !== 'pids.json');
      if (remaining.length === 0) {
        rmSync('.local-runtime', { recursive: true, force: true });
        console.log('  \u2713 Runtime directory removed');
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(`  \u2717 Failed to check runtime directory: ${e.message}`);
        failures++;
      }
    }
  }

  console.log('Stopping Docker Compose services...');
  try {
    execSync('docker compose --env-file .env.local down', { stdio: 'inherit' });
    console.log('  \u2713 Docker Compose services stopped (volumes preserved)');
  } catch (e) {
    console.error(`  \u2717 Docker Compose down failed: ${e.message}`);
    failures++;
  }

  console.log('\nTo reset completely (destructive): docker compose -f compose.yaml down -v && rm -f .env.local');

  if (failures === 0) {
    console.log('\nAll services stopped successfully.');
  } else {
    console.error(`\n${failures} operation(s) had errors.`);
    process.exitCode = 1;
  }
}

main();
