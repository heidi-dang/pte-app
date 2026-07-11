/**
 * Shared process lifecycle helpers.
 * Plain JavaScript (ESM) — no TypeScript.
 */

import { execSync } from 'child_process';
import { createServer } from 'net';

// ── Process tracking ──────────────────────────────────────────────

export function trackChild(name, child) {
  return { name, child, rootPid: child.pid };
}

// ── Liveness ──────────────────────────────────────────────────────

export function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isChildAlive(child) {
  if (!child || child.pid == null) return false;
  if (child.exitCode !== null || child.signalCode !== null) return false;
  return isProcessAlive(child.pid);
}

// ── Process tree discovery ────────────────────────────────────────

export function getDescendantPids(rootPid) {
  const result = [];
  try {
    const output = execSync(`ps -o pid= --ppid ${rootPid} 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 });
    for (const line of output.trim().split('\n')) {
      const pid = parseInt(line.trim(), 10);
      if (!isNaN(pid)) {
        result.push(pid);
        result.push(...getDescendantPids(pid));
      }
    }
  } catch {}
  return result;
}

// ── Termination ───────────────────────────────────────────────────

export async function terminateManagedTree(managed, graceMs = 5000, killMs = 2000) {
  const { child, rootPid } = managed;

  // Phase 1: SIGTERM to descendants → process group → direct child
  for (const pid of getDescendantPids(rootPid)) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {}
  }
  try {
    process.kill(-rootPid, 'SIGTERM');
  } catch {}
  try {
    child.kill('SIGTERM');
  } catch {}

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, graceMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.once('error', () => {
      clearTimeout(timer);
      resolve();
    });
  });

  if (isChildAlive(child) || isProcessAlive(rootPid)) {
    for (const pid of getDescendantPids(rootPid)) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
    try {
      process.kill(-rootPid, 'SIGKILL');
    } catch {}
    try {
      child.kill('SIGKILL');
    } catch {}

    await new Promise((resolve) => {
      const timer = setTimeout(resolve, killMs);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      child.once('close', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  const final = isChildAlive(child) || isProcessAlive(rootPid);
  return { stopped: !final, unresolved: final };
}

// ── Port availability ─────────────────────────────────────────────

export function isPortOpen(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, host);
  });
}

export async function checkPortsOccupied(ports) {
  const results = [];
  for (const { name, port } of ports) {
    const occupied = await isPortOpen(port);
    results.push({ name, port, occupied });
  }
  return results;
}
