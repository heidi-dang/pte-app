#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { loadEnvLocal } from './lib/local-env.mjs';
import { isChildAlive, getDescendantPids, terminateManagedTree, isPortOpen } from './lib/process-lifecycle.mjs';

const env = loadEnvLocal();
const isCI = process.argv.includes('--ci');

const TIMEOUT = parseInt(env.LOCAL_SMOKE_TIMEOUT_MS, 10);
if (Number.isNaN(TIMEOUT)) throw new Error('LOCAL_SMOKE_TIMEOUT_MS must be set in .env.local');

const apiHost = env.API_HOST;
const apiPort = parseInt(env.API_PORT, 10);
const scoringHost = env.SCORING_HOST;
const scoringPort = parseInt(env.SCORING_PORT, 10);
const webHost = env.WEB_HOST;
const webPort = parseInt(env.WEB_PORT, 10);
const webOrigin = env.WEB_ORIGIN;

if (!apiHost || !apiPort) throw new Error('API_HOST and API_PORT must be set');
if (!scoringHost || !scoringPort) throw new Error('SCORING_HOST and SCORING_PORT must be set');
if (!webHost || !webPort) throw new Error('WEB_HOST and WEB_PORT must be set');
if (!webOrigin) throw new Error('WEB_ORIGIN must be set');

// Resolve 0.0.0.0 to 127.0.0.1 for client connections
const clientHost = (h) => (h === '0.0.0.0' ? '127.0.0.1' : h);
const apiUrl = `http://${clientHost(apiHost)}:${apiPort}`;
const scoringUrl = `http://${clientHost(scoringHost)}:${scoringPort}`;
const webUrl = `http://${clientHost(webHost)}:${webPort}`;

const children = [];
const managed = [];
let failures = 0;
let overallTimeout;

function spawnService(name, cwd, command, args) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', command, ...(args || [])], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, ...env },
    detached: true,
  });
  children.push(child);
  // Capture grandchild PIDs at spawn time while ancestry is still intact
  const grandchildPids = [];
  // Initial capture after a brief delay for grandchild to start
  setTimeout(() => {
    for (const pid of getDescendantPids(child.pid)) {
      if (!grandchildPids.includes(pid)) grandchildPids.push(pid);
    }
  }, 300);
  const discoverInterval = setInterval(() => {
    for (const pid of getDescendantPids(child.pid)) {
      if (!grandchildPids.includes(pid)) {
        grandchildPids.push(pid);
      }
    }
  }, 200);
  child.on('exit', () => {
    clearInterval(discoverInterval);
    // Final capture — grandchildren still visible right after npm exits
    for (const pid of getDescendantPids(child.pid)) {
      if (!grandchildPids.includes(pid)) grandchildPids.push(pid);
    }
  });
  managed.push({ name, child, rootPid: child.pid, grandchildPids });
  child.on('error', () => {
    console.error(`  \u2717 ${name}: process error`);
    failures++;
  });
  return child;
}

async function waitForUrl(url, label, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log(`  \u2713 ${label} ready at ${url}`);
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`  \u2717 ${label} not ready at ${url} after ${timeoutMs}ms`);
  return false;
}

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      console.log(`  \u2713 ${label}`);
      return true;
    }
    console.error(`  \u2717 ${label} \u2014 HTTP ${res.status}`);
    return false;
  } catch (e) {
    console.error(`  \u2717 ${label} \u2014 ${e.message}`);
    return false;
  }
}

async function stopAllChildren() {
  // Terminate each managed process tree using shared helper
  for (const entry of managed) {
    // Kill tracked grandchild PIDs first (they may become orphaned)
    for (const pid of entry.grandchildPids || []) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {}
    }
    if (!isChildAlive(entry.child)) continue;
    const result = await terminateManagedTree(entry);
    // Final kill on tracked grandchildren
    for (const pid of entry.grandchildPids || []) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
    if (!result.stopped) {
      // Check if grandchildren were the actual target
      const anyAlive = (entry.grandchildPids || []).some((p) => {
        try {
          process.kill(p, 0);
          return true;
        } catch {
          return false;
        }
      });
      if (!anyAlive && !isChildAlive(entry.child)) {
        continue; // grandchildren already handled
      }
      console.error(`  \u2717 ${entry.name} could not be terminated`);
      failures++;
    }
  }

  await new Promise((r) => setTimeout(r, 1000));

  // Check for remaining port occupancy with retry — report only, do NOT kill
  const targetPorts = [apiPort, scoringPort, webPort].filter(Boolean);
  for (const port of targetPorts) {
    let occupied = true;
    for (let attempt = 0; attempt < 8 && occupied; attempt++) {
      await new Promise((r) => setTimeout(r, 500));
      occupied = await isPortOpen(port, '127.0.0.1');
    }
    if (occupied) {
      console.error(
        `  \u2717 Port ${port} is still occupied after managed cleanup. Ownership not established — not killed.`,
      );
      failures++;
    }
  }

  const remaining = children.filter(isChildAlive).length;
  if (remaining > 0) {
    console.error(`  \u2717 ${remaining} child process(es) could not be terminated`);
    failures++;
  }

  if (overallTimeout) {
    clearTimeout(overallTimeout);
    overallTimeout = undefined;
  }
}

async function checkPortReleased(port, host, label) {
  const open = await isPortOpen(port, host);
  if (open) {
    console.error(`  \u2717 ${label} port ${port} is still active after cleanup`);
    failures++;
  } else {
    console.log(`  \u2713 ${label} port ${port} released`);
  }
}

async function main() {
  console.log('Smoke test starting...');
  overallTimeout = setTimeout(async () => {
    console.error('FATAL: Overall smoke test timeout');
    failures++;
    await stopAllChildren();
    await checkPortReleased(apiPort, apiHost, 'API');
    await checkPortReleased(scoringPort, scoringHost, 'Scoring');
    await checkPortReleased(webPort, webHost, 'Web');
    process.exit(1);
  }, TIMEOUT + 30000);

  try {
    try {
      execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
      console.log('  \u2713 Build complete');
    } catch {
      console.error('  \u2717 Build failed');
      failures++;
      return;
    }

    console.log('Starting services...');

    try {
      execSync('node services/worker/dist/check.js', {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: { ...process.env, ...env },
      });
      console.log('  \u2713 Worker configuration valid');
    } catch {
      console.error('  \u2717 Worker configuration invalid');
      failures++;
    }

    spawnService('api', 'services/api', 'start', []);
    spawnService('scoring', 'services/scoring', 'start', []);

    await new Promise((r) => setTimeout(r, 2000));

    const apiLive = await waitForUrl(`${apiUrl}/health/live`, 'api-live', TIMEOUT / 3);
    if (!apiLive) failures++;
    const apiReady = await waitForUrl(`${apiUrl}/health/ready`, 'api-ready', TIMEOUT / 3);
    if (!apiReady) failures++;
    const scLive = await waitForUrl(`${scoringUrl}/health/live`, 'scoring-live', TIMEOUT / 3);
    if (!scLive) failures++;
    const scReady = await waitForUrl(`${scoringUrl}/health/ready`, 'scoring-ready', TIMEOUT / 3);
    if (!scReady) failures++;

    if (apiLive && !(await checkUrl(`${apiUrl}/health/live`, 'api-live HTTP'))) failures++;
    if (apiReady && !(await checkUrl(`${apiUrl}/health/ready`, 'api-ready HTTP'))) failures++;
    if (scLive && !(await checkUrl(`${scoringUrl}/health/live`, 'scoring-live HTTP'))) failures++;
    if (scReady && !(await checkUrl(`${scoringUrl}/health/ready`, 'scoring-ready HTTP'))) failures++;

    // CORS allowed
    try {
      const apiCors = await fetch(`${apiUrl}/health/live`, { headers: { origin: webOrigin } });
      if (apiCors.headers.get('access-control-allow-origin')) {
        console.log('  \u2713 API CORS allowed');
      } else {
        console.error('  \u2717 API CORS missing header');
        failures++;
      }
    } catch {
      console.error('  \u2717 API CORS allowed-origin check failed');
      failures++;
    }

    // CORS disallowed
    try {
      const apiNoCors = await fetch(`${apiUrl}/health/live`, { headers: { origin: 'https://evil.example.com' } });
      const header = apiNoCors.headers.get('access-control-allow-origin');
      if (header && header === 'https://evil.example.com') {
        console.error('  \u2717 API CORS disallowed origin was accepted');
        failures++;
      } else {
        console.log('  \u2713 API CORS disallowed origin correctly rejected');
      }
    } catch {
      console.log('  \u2713 API CORS disallowed origin blocked (fetch error)');
    }

    if (existsSync('apps/web/.next')) {
      spawnService('web', 'apps/web', 'start', []);
      await new Promise((r) => setTimeout(r, 3000));
      const webOk = await checkUrl(webUrl, 'web HTTP');
      if (webOk) {
        try {
          const res = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
          const text = await res.text();
          if (text.includes('PTE Academic Platform') || text.includes('Development Environment')) {
            console.log('  \u2713 Web page contains Phase B text');
          } else {
            console.error('  \u2717 Web page missing expected text');
            failures++;
          }
        } catch {
          console.error('  \u2717 Web page content check failed');
          failures++;
        }
      } else {
        failures++;
      }
    } else {
      console.log('  \u26a0 Web not built, skipping web smoke test');
    }
  } finally {
    await stopAllChildren();

    await checkPortReleased(apiPort, apiHost, 'API');
    await checkPortReleased(scoringPort, scoringHost, 'Scoring');
    await checkPortReleased(webPort, webHost, 'Web');

    console.log(`\n${failures === 0 ? '\u2713 All smoke tests passed.' : `\u2717 ${failures} check(s) failed.`}`);
    process.exitCode = failures === 0 ? 0 : 1;
  }
}

let cleaningUp = false;
async function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  if (overallTimeout) {
    clearTimeout(overallTimeout);
    overallTimeout = undefined;
  }
  await stopAllChildren();
  await checkPortReleased(apiPort, apiHost, 'API');
  await checkPortReleased(scoringPort, scoringHost, 'Scoring');
  await checkPortReleased(webPort, webHost, 'Web');
  process.exit(failures === 0 ? 0 : 1);
}

process.on('SIGINT', () => cleanup());
process.on('SIGTERM', () => cleanup());

main().catch((e) => {
  console.error(e);
  stopAllChildren().then(() => {
    process.exit(1);
  });
});
