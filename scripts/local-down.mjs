#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { execSync } from 'child_process';
import { loadEnvLocal } from './lib/local-env.mjs';

const env = loadEnvLocal();
const pidsPath = '.local-runtime/pids.json';
let failures = 0;

async function readCmdline(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, 'utf-8').split('\0').filter(Boolean).join(' ');
  } catch {
    return null;
  }
}

function matchesMarker(cmdline, marker) {
  if (!cmdline) return null; // cannot verify
  return cmdline.includes(marker);
}

async function stopProcess(entry, name_) {
  // Support both legacy {name: pid} and enhanced {pid, service, commandMarker} formats
  let pid, service, commandMarker;
  if (typeof entry === 'object' && entry !== null) {
    pid = entry.pid;
    service = entry.service || name_;
    commandMarker = entry.commandMarker || `@pte-app/${entry.service || name_}`;
  } else {
    pid = entry;
    service = name_;
    commandMarker = `@pte-app/${name_}`;
  }

  const name = service;
  const num = parseInt(pid, 10);
  if (isNaN(num) || num <= 0) {
    console.error(`  \u2717 Invalid PID for ${name}: ${pid}`);
    failures++;
    return;
  }

  // Check if PID exists
  let pidAlive = false;
  try {
    process.kill(num, 0);
    pidAlive = true;
  } catch {
    console.log(`  \u2014 ${name} (PID ${num}) not running`);
    return;
  }

  // Verify process identity
  if (process.platform === 'linux') {
    const cmdline = await readCmdline(num);
    const match = matchesMarker(cmdline, commandMarker);
    if (match === false) {
      console.error(`  \u2717 PID ${num} for ${name} has different identity (reused). cmdline: ${cmdline}`);
      console.log(`  \u2014 Removing stale state for ${name}`);
      failures++;
      return;
    }
    if (match === null) {
      console.log(`  \u26a0 ${name} (PID ${num}) - could not read cmdline, continuing with caution`);
    }
  } else {
    console.log(`  \u26a0 ${name} (PID ${num}) - cmdline verification only on Linux`);
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
      } catch {}
      // Wait after SIGKILL and confirm
      const killStart = Date.now();
      let killed = false;
      while (Date.now() - killStart < 2000 && !killed) {
        await new Promise((r) => setTimeout(r, 200));
        try {
          process.kill(num, 0);
        } catch {
          killed = true;
        }
      }
      if (!killed) {
        console.error(`  \u2717 ${name} (PID ${num}) still alive after SIGKILL`);
        failures++;
        return;
      }
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

    for (const [name, entry] of Object.entries(pids)) {
      await stopProcess(entry, name);
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
      console.error(`  \u2717 Failed to check runtime directory: ${e.message}`);
      failures++;
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
