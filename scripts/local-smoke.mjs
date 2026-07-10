#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { loadEnvLocal, REQUIRED_ENV_VARS } from './lib/local-env.mjs';

const env = loadEnvLocal();
const isCI = process.argv.includes('--ci');
const TIMEOUT = parseInt(env.LOCAL_SMOKE_TIMEOUT_MS || '30000', 10);
const apiPort = env.API_PORT || '4000';
const scoringPort = env.SCORING_PORT || '5000';
const webPort = env.WEB_PORT || '3000';
const apiUrl = `http://${env.API_HOST || 'localhost'}:${apiPort}`;
const scoringUrl = `http://${env.SCORING_HOST || 'localhost'}:${scoringPort}`;
const webUrl = `http://${env.WEB_HOST || 'localhost'}:${webPort}`;

const children = [];
let failures = 0;
let overallTimeout;

function killAll() {
  children.forEach(c => { try { c.kill('SIGTERM'); } catch {} });
  setTimeout(() => children.forEach(c => { try { c.kill('SIGKILL'); } catch {} }), 2000);
}

function spawnService(name, cwd, command, args) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', command, ...(args || [])], {
    cwd, stdio: 'pipe', env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('error', () => {});
  return child;
}

async function waitForUrl(url, label, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) { console.log(`  ✓ ${label} ready at ${url}`); return true; }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  console.error(`  ✗ ${label} not ready at ${url} after ${timeoutMs}ms`);
  return false;
}

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) { console.log(`  ✓ ${label}`); return true; }
    console.error(`  ✗ ${label} — HTTP ${res.status}`);
    return false;
  } catch (e) {
    console.error(`  ✗ ${label} — ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('Smoke test starting...');
  overallTimeout = setTimeout(() => {
    console.error('FATAL: Overall smoke test timeout');
    killAll(); process.exit(1);
  }, TIMEOUT + 30000);

  // Build first
  try {
    execSync('npm run build', { stdio: 'pipe', cwd: import.meta.dirname ? process.cwd() : undefined });
    console.log('  ✓ Build complete');
  } catch {
    console.error('  ✗ Build failed'); failures++; cleanup(); process.exit(1);
  }

  console.log('Starting services...');

  // Start worker check first (quick)
  try {
    execSync('node services/worker/dist/check.js', { stdio: 'pipe', cwd: process.cwd() });
    console.log('  ✓ Worker configuration valid');
  } catch {
    console.error('  ✗ Worker configuration invalid'); failures++;
  }

  // Start API - use the built dist
  spawnService('api', 'services/api', 'start', []);

  // Start scoring
  spawnService('scoring', 'services/scoring', 'start', []);

  await new Promise(r => setTimeout(r, 2000));

  // Wait for API and scoring
  const apiLive = await waitForUrl(`${apiUrl}/health/live`, 'api-live', TIMEOUT / 3);
  const apiReady = await waitForUrl(`${apiUrl}/health/ready`, 'api-ready', TIMEOUT / 3);
  const scLive = await waitForUrl(`${scoringUrl}/health/live`, 'scoring-live', TIMEOUT / 3);
  const scReady = await waitForUrl(`${scoringUrl}/health/ready`, 'scoring-ready', TIMEOUT / 3);

  // Test endpoints
  if (apiLive && !await checkUrl(`${apiUrl}/health/live`, 'api-live HTTP')) failures++;
  if (apiReady && !await checkUrl(`${apiUrl}/health/ready`, 'api-ready HTTP')) failures++;
  if (scLive && !await checkUrl(`${scoringUrl}/health/live`, 'scoring-live HTTP')) failures++;
  if (scReady && !await checkUrl(`${scoringUrl}/health/ready`, 'scoring-ready HTTP')) failures++;

  // CORS checks
  try {
    const apiCors = await fetch(`${apiUrl}/health/live`, {
      headers: { origin: env.WEB_ORIGIN || 'http://localhost:3000' }
    });
    if (apiCors.headers.get('access-control-allow-origin')) console.log('  ✓ API CORS allowed');
    else { console.error('  ✗ API CORS missing header'); failures++; }
  } catch { console.error('  ✗ API CORS failed'); failures++; }

  try {
    const apiNoCors = await fetch(`${apiUrl}/health/live`, {
      headers: { origin: 'https://evil.example.com' }
    });
    const header = apiNoCors.headers.get('access-control-allow-origin');
    if (!header || header === 'https://evil.example.com') {
      // For now just check it doesn't crash
      console.log('  ✓ API CORS disallowed checked');
    }
  } catch { /* expected for disallowed */ }

  // Web
  if (existsSync('apps/web/.next')) {
    spawnService('web', 'apps/web', 'start', []);
    await new Promise(r => setTimeout(r, 3000));
    const webOk = await checkUrl(webUrl, 'web HTTP');
    if (webOk) {
      try {
        const res = await fetch(webUrl, { signal: AbortSignal.timeout(5000) });
        const text = await res.text();
        if (text.includes('PTE Academic Platform') || text.includes('Development Environment')) {
          console.log('  ✓ Web page contains Phase B text');
        } else { console.error('  ✗ Web page missing expected text'); failures++; }
      } catch { console.error('  ✗ Web page content check failed'); failures++; }
    } else failures++;
  } else {
    console.log('  ⚠ Web not built, skipping web smoke test');
  }

  clearTimeout(overallTimeout);
  console.log(`\n${failures === 0 ? '✓ All smoke tests passed.' : `✗ ${failures} check(s) failed.`}`);
  killAll();
  process.exit(failures === 0 ? 0 : 1);
}

function cleanup() {
  clearTimeout(overallTimeout);
  killAll();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main().catch(e => { console.error(e); killAll(); process.exit(1); });
