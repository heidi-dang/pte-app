#!/usr/bin/env node
import { existsSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { loadEnvLocal, validateConfig } from './lib/local-env.mjs';

const env = loadEnvLocal();
const errors = validateConfig(env);
if (errors.length > 0) {
  console.error('Environment validation failed:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const apiPort = env.API_PORT;
const scoringPort = env.SCORING_PORT;
const webPort = env.WEB_PORT;
const apiHost = env.API_HOST;
const scoringHost = env.SCORING_HOST;
const webHost = env.WEB_HOST;
const timeout = parseInt(env.LOCAL_STARTUP_TIMEOUT_MS || '30000', 10);

const children = [];
const pids = {};

async function waitForUrl(url, label, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log(`  ✓ ${label}`);
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`  ✗ ${label} timed out after ${timeoutMs}ms`);
  return false;
}

console.log('[1/5] Validating environment...');
try {
  execSync('npm run doctor', { stdio: 'pipe' });
} catch {
  console.error('Doctor failed. Run npm run doctor for details.');
  process.exit(1);
}
console.log('OK');

console.log('[2/5] Starting infrastructure...');
try {
  execSync('docker compose --env-file .env.local up -d', { stdio: 'inherit' });
} catch {
  console.error('Docker Compose failed');
  process.exit(1);
}
console.log('OK');

console.log('[3/5] Waiting for containers...');
const pgUser = env.POSTGRES_USER;
const pgDb = env.POSTGRES_DATABASE;
// Actually use proper polling
const pgStart = Date.now();
let pgHealthy = false;
while (Date.now() - pgStart < timeout && !pgHealthy) {
  try {
    execSync(`docker compose exec postgres pg_isready -U ${pgUser} -d ${pgDb}`, { stdio: 'pipe' });
    pgHealthy = true;
    console.log('  ✓ PostgreSQL healthy');
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!pgHealthy) {
  console.error('  ✗ PostgreSQL not healthy');
  process.exit(1);
}

const redisStart = Date.now();
let redisHealthy = false;
while (Date.now() - redisStart < timeout && !redisHealthy) {
  try {
    execSync('docker compose exec redis redis-cli ping', { stdio: 'pipe' });
    redisHealthy = true;
    console.log('  ✓ Redis healthy');
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!redisHealthy) {
  console.error('  ✗ Redis not healthy');
  process.exit(1);
}
console.log('OK');

console.log('[4/5] Starting services...');
const workspaces = [
  { name: 'api', ws: '@pte-app/api', dir: 'services/api' },
  { name: 'scoring', ws: '@pte-app/scoring', dir: 'services/scoring' },
  { name: 'worker', ws: '@pte-app/worker', dir: 'services/worker' },
  { name: 'web', ws: '@pte-app/web', dir: 'apps/web' },
];

for (const ws of workspaces) {
  const child = spawn(npmCmd, ['--workspace', ws.ws, 'run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, ...env },
  });
  children.push(child);
  pids[ws.name] = child.pid;
  child.stdout.on('data', (d) => process.stdout.write(`[${ws.name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${ws.name}] ${d}`));
  child.on('exit', (code) => {
    console.error(`[${ws.name}] exited with code ${code}`);
    children.forEach((c) => !c.killed && c.kill());
    process.exit(1);
  });
}

// Write PIDs
if (!existsSync('.local-runtime')) require('fs').mkdirSync('.local-runtime');
writeFileSync('.local-runtime/pids.json', JSON.stringify(pids, null, 2));

console.log('[5/5] Waiting for service health...');
const apiLive = await waitForUrl(`http://${apiHost}:${apiPort}/health/live`, 'API live', timeout);
const apiReady = await waitForUrl(`http://${apiHost}:${apiPort}/health/ready`, 'API ready', timeout);
const scLive = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/live`, 'Scoring live', timeout);
const scReady = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/ready`, 'Scoring ready', timeout);
const webOk = await waitForUrl(`http://${webHost}:${webPort}`, 'Web', timeout);
const workerOk = await waitForUrl(`http://${apiHost}:${apiPort}/health/live`, 'Worker', 5000);

const allOk = apiLive && apiReady && scLive && scReady && webOk;
if (allOk) {
  console.log('\nAll services started.');
  console.log(`  Web:      http://${webHost}:${webPort}`);
  console.log(`  API:      http://${apiHost}:${apiPort}`);
  console.log(`  Scoring:  http://${scoringHost}:${scoringPort}`);
} else {
  console.error('\nSome services failed to start.');
  process.exit(1);
}

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  children.forEach((c) => !c.killed && c.kill('SIGTERM'));
  setTimeout(() => children.forEach((c) => !c.killed && c.kill('SIGKILL')), 5000);
});
process.on('SIGTERM', () => {
  children.forEach((c) => !c.killed && c.kill('SIGTERM'));
  setTimeout(() => children.forEach((c) => !c.killed && c.kill('SIGKILL')), 5000);
});
