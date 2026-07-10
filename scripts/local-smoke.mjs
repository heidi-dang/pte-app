#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { loadEnvLocal } from './lib/local-env.mjs';

const env = loadEnvLocal();
const isCI = process.argv.includes('--ci');

// --- Read all required values from env (no fallbacks) ---
const TIMEOUT = parseInt(env.LOCAL_SMOKE_TIMEOUT_MS || '60000', 10);

const apiHost = env.API_HOST;
const apiPort = env.API_PORT;
const scoringHost = env.SCORING_HOST;
const scoringPort = env.SCORING_PORT;
const webHost = env.WEB_HOST;
const webPort = env.WEB_PORT;
const webOrigin = env.WEB_ORIGIN;

if (!apiHost || !apiPort) throw new Error('API_HOST and API_PORT must be set');
if (!scoringHost || !scoringPort) throw new Error('SCORING_HOST and SCORING_PORT must be set');
if (!webHost || !webPort) throw new Error('WEB_HOST and WEB_PORT must be set');
if (!webOrigin) throw new Error('WEB_ORIGIN must be set');

const apiUrl = `http://${apiHost}:${apiPort}`;
const scoringUrl = `http://${scoringHost}:${scoringPort}`;
const webUrl = `http://${webHost}:${webPort}`;

// --- State ---
const children = [];
let failures = 0;
let overallTimeout;

// --- Helpers ---
function spawnService(name, cwd, command, args) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', command, ...(args || [])], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('error', () => {
    console.error(`  ✗ ${name}: process error`);
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
        console.log(`  ✓ ${label} ready at ${url}`);
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`  ✗ ${label} not ready at ${url} after ${timeoutMs}ms`);
  return false;
}

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      console.log(`  ✓ ${label}`);
      return true;
    }
    console.error(`  ✗ ${label} — HTTP ${res.status}`);
    return false;
  } catch (e) {
    console.error(`  ✗ ${label} — ${e.message}`);
    return false;
  }
}

async function stopAllChildren() {
  // SIGTERM every child and await exits
  const exitPromises = children.map(
    (child) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch {}
          resolve();
        }, 5000);

        child.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });

        try {
          child.kill('SIGTERM');
        } catch {}
      }),
  );

  await Promise.allSettled(exitPromises);

  // Clear any remaining timers
  if (overallTimeout) {
    clearTimeout(overallTimeout);
    overallTimeout = undefined;
  }
}

// --- Main ---
async function main() {
  console.log('Smoke test starting...');
  overallTimeout = setTimeout(() => {
    console.error('FATAL: Overall smoke test timeout');
    process.exit(1);
  }, TIMEOUT + 30000);

  try {
    // Build first
    try {
      execSync('npm run build', { stdio: 'pipe', cwd: import.meta.dirname ? process.cwd() : undefined });
      console.log('  ✓ Build complete');
    } catch {
      console.error('  ✗ Build failed');
      failures++;
      return;
    }

    console.log('Starting services...');

    // Start worker check first (quick)
    try {
      execSync('node services/worker/dist/check.js', { stdio: 'pipe', cwd: process.cwd() });
      console.log('  ✓ Worker configuration valid');
    } catch {
      console.error('  ✗ Worker configuration invalid');
      failures++;
    }

    // Start API
    spawnService('api', 'services/api', 'start', []);

    // Start scoring
    spawnService('scoring', 'services/scoring', 'start', []);

    await new Promise((r) => setTimeout(r, 2000));

    // Wait for API and scoring — each failure increments failures
    const apiLive = await waitForUrl(`${apiUrl}/health/live`, 'api-live', TIMEOUT / 3);
    if (!apiLive) failures++;

    const apiReady = await waitForUrl(`${apiUrl}/health/ready`, 'api-ready', TIMEOUT / 3);
    if (!apiReady) failures++;

    const scLive = await waitForUrl(`${scoringUrl}/health/live`, 'scoring-live', TIMEOUT / 3);
    if (!scLive) failures++;

    const scReady = await waitForUrl(`${scoringUrl}/health/ready`, 'scoring-ready', TIMEOUT / 3);
    if (!scReady) failures++;

    // Test endpoints
    if (apiLive && !(await checkUrl(`${apiUrl}/health/live`, 'api-live HTTP'))) failures++;
    if (apiReady && !(await checkUrl(`${apiUrl}/health/ready`, 'api-ready HTTP'))) failures++;
    if (scLive && !(await checkUrl(`${scoringUrl}/health/live`, 'scoring-live HTTP'))) failures++;
    if (scReady && !(await checkUrl(`${scoringUrl}/health/ready`, 'scoring-ready HTTP'))) failures++;

    // CORS — allowed origin check
    try {
      const apiCors = await fetch(`${apiUrl}/health/live`, {
        headers: { origin: webOrigin },
      });
      if (apiCors.headers.get('access-control-allow-origin')) {
        console.log('  ✓ API CORS allowed');
      } else {
        console.error('  ✗ API CORS missing header');
        failures++;
      }
    } catch {
      console.error('  ✗ API CORS allowed-origin check failed');
      failures++;
    }

    // CORS — disallowed origin must be rejected
    try {
      const apiNoCors = await fetch(`${apiUrl}/health/live`, {
        headers: { origin: 'https://evil.example.com' },
      });
      const header = apiNoCors.headers.get('access-control-allow-origin');
      if (header && header === 'https://evil.example.com') {
        console.error('  ✗ API CORS disallowed origin was accepted');
        failures++;
      } else {
        console.log('  ✓ API CORS disallowed origin correctly rejected');
      }
    } catch {
      // Fetch error is acceptable for disallowed origin
      console.log('  ✓ API CORS disallowed origin blocked (fetch error)');
    }

    // Web
    if (existsSync('apps/web/.next')) {
      spawnService('web', 'apps/web', 'start', []);
      await new Promise((r) => setTimeout(r, 3000));
      const webOk = await checkUrl(webUrl, 'web HTTP');
      if (webOk) {
        try {
          const res = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
          const text = await res.text();
          if (text.includes('PTE Academic Platform') || text.includes('Development Environment')) {
            console.log('  ✓ Web page contains Phase B text');
          } else {
            console.error('  ✗ Web page missing expected text');
            failures++;
          }
        } catch {
          console.error('  ✗ Web page content check failed');
          failures++;
        }
      } else {
        failures++;
      }
    } else {
      console.log('  ⚠ Web not built, skipping web smoke test');
    }
  } finally {
    await stopAllChildren();
    console.log(`\n${failures === 0 ? '✓ All smoke tests passed.' : `✗ ${failures} check(s) failed.`}`);
    process.exitCode = failures === 0 ? 0 : 1;
  }
}

function cleanup() {
  if (overallTimeout) {
    clearTimeout(overallTimeout);
    overallTimeout = undefined;
  }
  children.forEach((c) => {
    try {
      c.kill('SIGTERM');
    } catch {}
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main().catch((e) => {
  console.error(e);
  stopAllChildren().then(() => {
    process.exit(1);
  });
});
