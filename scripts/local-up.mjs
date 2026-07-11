#!/usr/bin/env node
import { existsSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { spawn, execSync, execFileSync } from 'child_process';
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
const timeout = parseInt(env.LOCAL_STARTUP_TIMEOUT_MS, 10);
if (Number.isNaN(timeout)) throw new Error('LOCAL_STARTUP_TIMEOUT_MS must be set in .env.local');

const children = [];
const pids = {};
let shuttingDown = false;

async function shutdown(reason, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`\nShutdown: ${reason}`);

  const killPromises = children.map((child) => {
    if (child.killed || child.exitCode !== null) return Promise.resolve();
    return new Promise((resolve) => {
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
      child.once('error', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        child.kill('SIGTERM');
      } catch {}
    });
  });
  await Promise.allSettled(killPromises);

  if (existsSync('.local-runtime/pids.json')) {
    try {
      rmSync('.local-runtime/pids.json');
    } catch {}
  }
  try {
    const files = readFileSync('.local-runtime', 'utf-8').split('\n').filter(Boolean);
    if (files.length === 0) rmSync('.local-runtime');
  } catch {}

  console.error(`All children terminated (${reason})`);
  process.exitCode = exitCode;
}

async function waitForUrl(url, label, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log(`  \u2713 ${label}`);
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`  \u2717 ${label} timed out after ${timeoutMs}ms`);
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
const pgStart = Date.now();
let pgHealthy = false;
while (Date.now() - pgStart < timeout && !pgHealthy) {
  try {
    execFileSync('docker', ['compose', 'exec', 'postgres', 'pg_isready', '-U', pgUser, '-d', pgDb], { stdio: 'pipe' });
    pgHealthy = true;
    console.log('  \u2713 PostgreSQL healthy');
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!pgHealthy) {
  console.error('  \u2717 PostgreSQL not healthy');
  process.exit(1);
}

const redisStart = Date.now();
let redisHealthy = false;
while (Date.now() - redisStart < timeout && !redisHealthy) {
  try {
    execFileSync('docker', ['compose', 'exec', 'redis', 'redis-cli', 'ping'], { stdio: 'pipe' });
    redisHealthy = true;
    console.log('  \u2713 Redis healthy');
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!redisHealthy) {
  console.error('  \u2717 Redis not healthy');
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
    if (shuttingDown) return;
    console.error(`[${ws.name}] exited unexpectedly with code ${code}`);
    shutdown(`child ${ws.name} crashed`, 1);
  });
}

if (!existsSync('.local-runtime')) mkdirSync('.local-runtime');
writeFileSync('.local-runtime/pids.json', JSON.stringify(pids, null, 2));

console.log('[5/5] Waiting for service health...');
const apiLive = await waitForUrl(`http://${apiHost}:${apiPort}/health/live`, 'API live', timeout);
const apiReady = await waitForUrl(`http://${apiHost}:${apiPort}/health/ready`, 'API ready', timeout);
const scLive = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/live`, 'Scoring live', timeout);
const scReady = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/ready`, 'Scoring ready', timeout);
const webOk = await waitForUrl(`http://${webHost}:${webPort}`, 'Web', timeout);

const workerProcess = children.find((c) => pids.worker && c.pid === pids.worker) || children[2];
let workerReady = false;
const workerStart = Date.now();
while (Date.now() - workerStart < timeout && !workerReady && workerProcess.exitCode === null) {
  await new Promise((r) => setTimeout(r, 200));
}
if (workerProcess.exitCode !== null && !shuttingDown) {
  console.error('  \u2717 Worker exited before readiness');
  await shutdown('worker exited before ready', 1);
}

async function waitForWorkerStdout(timeoutMs) {
  const worker = children.find((c) => pids.worker && c.pid === pids.worker) || children[2];
  if (!worker) {
    console.error('  \u2717 Worker process not found');
    return false;
  }
  return new Promise((resolve) => {
    const start = Date.now();
    const onData = (data) => {
      if (shuttingDown) return;
      const text = data.toString();
      if (text.includes('worker_ready')) {
        console.log('  \u2713 Worker ready (worker_ready event detected)');
        workerReady = true;
        worker.stdout.removeListener('data', onData);
        worker.stderr.removeListener('data', onData);
        resolve(true);
      }
    };
    worker.stdout.on('data', onData);
    worker.stderr.on('data', onData);
    const timer = setInterval(() => {
      if (worker.exitCode !== null && !workerReady && !shuttingDown) {
        console.error('  \u2717 Worker exited before emitting worker_ready');
        clearInterval(timer);
        worker.stdout.removeListener('data', onData);
        worker.stderr.removeListener('data', onData);
        resolve(false);
      }
      if (Date.now() - start > timeoutMs && !workerReady) {
        console.error('  \u2717 Worker readiness timed out');
        clearInterval(timer);
        worker.stdout.removeListener('data', onData);
        worker.stderr.removeListener('data', onData);
        resolve(false);
      }
      if (workerReady) {
        clearInterval(timer);
      }
    }, 500);
  });
}

const workerOk = await waitForWorkerStdout(timeout);

const allOk = apiLive && apiReady && scLive && scReady && webOk && workerOk;
if (allOk) {
  console.log('\nAll services started.');
  console.log(`  Web:      http://${webHost}:${webPort}`);
  console.log(`  API:      http://${apiHost}:${apiPort}`);
  console.log(`  Scoring:  http://${scoringHost}:${scoringPort}`);
} else {
  const failed = [];
  if (!apiLive) failed.push('API live');
  if (!apiReady) failed.push('API ready');
  if (!scLive) failed.push('Scoring live');
  if (!scReady) failed.push('Scoring ready');
  if (!webOk) failed.push('Web');
  if (!workerOk) failed.push('Worker');
  console.error(`\nSome services failed to start: ${failed.join(', ')}`);
  await shutdown('service readiness failure', 1);
}

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
