#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'child_process';
import { loadEnvLocal } from './lib/local-env.mjs';

const env = loadEnvLocal();
const pidsPath = '.local-runtime/pids.json';
let failures = 0;
const unresolvedEntries = {};

async function readCmdline(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, 'utf-8').split('\0').filter(Boolean).join(' ');
  } catch {
    return null;
  }
}

async function getCommandMacOS(pid) {
  try {
    const { execSync } = await import('child_process');
    return execSync(`ps -p ${pid} -o command=`, { encoding: 'utf-8', timeout: 2000 }).trim();
  } catch {
    return null;
  }
}

async function getCommandWindows(pid) {
  try {
    const { execSync } = await import('child_process');
    return execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf-8', timeout: 2000 }).trim();
  } catch {
    return null;
  }
}

function matchesMarker(cmdline, marker) {
  if (!cmdline) return null;
  return cmdline.includes(marker);
}

async function stopProcess(entry, name_) {
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
  let cmdline = null;
  const platform = process.platform;

  if (platform === 'linux') {
    cmdline = await readCmdline(num);
  } else if (platform === 'darwin') {
    if (process.arch !== 'arm64' && process.arch !== 'x64') {
      cmdline = null;
    } else {
      cmdline = await getCommandMacOS(num);
    }
  } else if (platform === 'win32') {
    cmdline = await getCommandWindows(num);
  }

  let identityMatch = null;
  if (cmdline !== null) {
    identityMatch = matchesMarker(cmdline, commandMarker);
  }

  if (identityMatch === false) {
    console.error(`  \u2717 PID ${num} for ${name} has different identity (reused). cmdline: ${cmdline}`);
    console.log(`  \u2014 Preserving stale state for manual review`);
    unresolvedEntries[name] = entry;
    failures++;
    return;
  }

  if (identityMatch === null) {
    // Cannot verify identity on this platform - do not kill automatically
    console.log(`  \u26a0 ${name} (PID ${num}) - cannot verify process identity on ${platform}`);
    console.log(`  \u2014 Preserving state for manual cleanup: kill -TERM ${num}`);
    unresolvedEntries[name] = entry;
    return;
  }

  // Identity verified - safe to proceed
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
        unresolvedEntries[name] = entry;
        failures++;
        return;
      }
      console.log(`  \u2713 ${name} (PID ${num}) force-killed and confirmed exited`);
    } else {
      console.log(`  \u2713 ${name} (PID ${num}) stopped`);
    }
  } catch (e) {
    console.error(`  \u2717 ${name} (PID ${num}) could not be stopped: ${e.message}`);
    unresolvedEntries[name] = entry;
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

    if (Object.keys(unresolvedEntries).length === 0) {
      try {
        rmSync(pidsPath);
        console.log('  \u2713 PID state removed');
      } catch (e) {
        console.error(`  \u2717 Failed to remove PID state: ${e.message}`);
        failures++;
      }
    } else {
      writeFileSync(pidsPath, JSON.stringify(unresolvedEntries, null, 2));
      console.error(`  \u2717 ${Object.keys(unresolvedEntries).length} unresolved process(es) preserved in pids.json`);
      console.log(`  \u2014 Manual cleanup required for: ${Object.keys(unresolvedEntries).join(', ')}`);
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
    execFileSync('docker', ['compose', '--env-file', '.env.local', 'down'], { stdio: 'inherit' });
    console.log('  \u2713 Docker Compose services stopped (volumes preserved)');
  } catch (e) {
    console.error(`  \u2717 Docker Compose down failed: ${e.message}`);
    failures++;
  }

  console.log('\nTo reset completely (destructive): docker compose --env-file .env.local down -v && rm -f .env.local');

  if (failures === 0 && Object.keys(unresolvedEntries).length === 0) {
    console.log('\nAll services stopped successfully.');
  } else {
    console.error(`\n${failures} operation(s) had errors.`);
    process.exitCode = 1;
  }
}

main();
