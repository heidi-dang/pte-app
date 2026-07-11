#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { createServer } from 'net';
import { loadEnvLocal } from './lib/local-env.mjs';

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

const apiUrl = `http://${apiHost}:${apiPort}`;
const scoringUrl = `http://${scoringHost}:${scoringPort}`;
const webUrl = `http://${webHost}:${webPort}`;

const children = [];
let failures = 0;
let overallTimeout;

function isChildAlive(child) {
  if (!child || child.pid == null) return false;
  if (child.exitCode !== null || child.signalCode !== null) return false;
  try {
    process.kill(child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isPortOpen(port, host) {
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

function spawnService(name, cwd, command, args) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', command, ...(args || [])], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, ...env },
  });
  children.push(child);
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
  // Phase 1: SIGTERM for graceful shutdown
  for (const child of children) {
    if (!isChildAlive(child)) continue;
    try {
      child.kill('SIGTERM');
    } catch {}
  }

  // Wait up to 5s for graceful exit
  await Promise.allSettled(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (!isChildAlive(child)) return resolve();
          const timer = setTimeout(resolve, 5000);
          child.once('exit', () => {
            clearTimeout(timer);
            resolve();
          });
        }),
    ),
  );

  // Phase 2: SIGKILL for remaining
  for (const child of children) {
    if (!isChildAlive(child)) continue;
    try {
      child.kill('SIGKILL');
    } catch {}
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 2000);
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

  // Phase 3: Port-level kill for remaining
  for (const port of [apiPort, scoringPort, webPort].filter(Boolean)) {
    try {
      execSync(`fuser -k -n tcp ${port} 2>/dev/null`, { stdio: 'pipe' });
    } catch {}
  }

  await new Promise((r) => setTimeout(r, 1000));

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
  overallTimeout = setTimeout(() => {
    console.error('FATAL: Overall smoke test timeout');
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

function cleanup() {
  if (overallTimeout) {
    clearTimeout(overallTimeout);
    overallTimeout = undefined;
  }
  for (const child of children) {
    if (!isChildAlive(child)) continue;
    try {
      child.kill('SIGTERM');
    } catch {}
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main().catch((e) => {
  console.error(e);
  stopAllChildren().then(() => {
    process.exit(1);
  });
});
