#!/usr/bin/env node
import { existsSync, writeFileSync, rmSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { spawn, execSync, execFileSync } from 'child_process';
import { createServer } from 'net';
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
let cleanupFailures = 0;

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

async function shutdown(reason, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`\nShutdown: ${reason}`);

  const killPromises = children.map(async (child) => {
    if (child.killed || child.exitCode !== null) return;
    try {
      child.kill('SIGTERM');
    } catch {}

    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 5000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      child.once('error', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    if (child.exitCode === null && !child.killed) {
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
        child.once('error', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    // Final liveness check
    if (child.exitCode === null && !child.killed) {
      try {
        process.kill(child.pid, 0);
        console.error(`  \u2717 ${child.pid} still alive after SIGKILL`);
        cleanupFailures++;
      } catch {
        // Expected - process is gone
      }
    }
  });
  await Promise.allSettled(killPromises);

  // Force-kill any survivor processes still listening on target ports
  const targetPorts = [parseInt(apiPort, 10), parseInt(scoringPort, 10), parseInt(webPort, 10)].filter(
    (p) => !Number.isNaN(p),
  );
  for (const port of targetPorts) {
    try {
      execSync(`fuser -k -n tcp ${port} 2>/dev/null`, { stdio: 'pipe' });
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 500));

  // Verify ports released
  if (apiPort && apiHost) {
    const open = await isPortOpen(parseInt(apiPort, 10), apiHost);
    if (open) {
      console.error(`  \u2717 API port ${apiPort} still active after shutdown`);
      cleanupFailures++;
    }
  }
  if (scoringPort && scoringHost) {
    const open = await isPortOpen(parseInt(scoringPort, 10), scoringHost);
    if (open) {
      console.error(`  \u2717 Scoring port ${scoringPort} still active after shutdown`);
      cleanupFailures++;
    }
  }
  if (webPort && webHost) {
    const open = await isPortOpen(parseInt(webPort, 10), webHost);
    if (open) {
      console.error(`  \u2717 Web port ${webPort} still active after shutdown`);
      cleanupFailures++;
    }
  }

  if (existsSync('.local-runtime/pids.json')) {
    try {
      rmSync('.local-runtime/pids.json');
    } catch {}
  }
  if (existsSync('.local-runtime')) {
    try {
      const entries = readdirSync('.local-runtime');
      if (entries.length === 0) {
        rmSync('.local-runtime', { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`  \u2717 Failed to check runtime directory: ${e.message}`);
      cleanupFailures++;
    }
  }

  if (cleanupFailures > 0) {
    console.error(`\n${cleanupFailures} cleanup failure(s) during shutdown`);
    process.exitCode = exitCode || 1;
  } else {
    console.error(`All children terminated (${reason})`);
    process.exitCode = exitCode;
  }
}

function createWorkerReadyPromise(worker, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const start = Date.now();

    function done(value) {
      if (settled) return;
      settled = true;
      clearInterval(pollTimer);
      worker.stdout?.removeListener('data', onData);
      worker.stderr?.removeListener('data', onData);
      worker.removeListener('exit', onExit);
      resolve(value);
    }

    const onData = (data) => {
      if (data.toString().includes('worker_ready')) {
        done(true);
      }
    };

    const onExit = () => {
      done(false);
    };

    const pollTimer = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        done(false);
      }
      if (worker.exitCode !== null && !settled) {
        done(false);
      }
    }, 200);

    worker.stdout?.on('data', onData);
    worker.stderr?.on('data', onData);
    worker.on('exit', onExit);
  });
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

let workerReadyPromise = null;

for (const ws of workspaces) {
  const child = spawn(npmCmd, ['--workspace', ws.ws, 'run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, ...env },
  });
  children.push(child);
  pids[ws.name] = {
    pid: child.pid,
    service: ws.name,
    startedAt: new Date().toISOString(),
    commandMarker: ws.ws,
  };
  child.stdout.on('data', (d) => process.stdout.write(`[${ws.name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${ws.name}] ${d}`));
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.error(`[${ws.name}] exited unexpectedly with code ${code}`);
    shutdown(`child ${ws.name} crashed`, 1);
  });

  if (ws.name === 'worker') {
    workerReadyPromise = createWorkerReadyPromise(child, timeout);
  }
}

if (!workerReadyPromise) {
  console.error('  \u2717 Worker process not created');
  await shutdown('worker creation failed', 1);
  return;
}

if (!existsSync('.local-runtime')) mkdirSync('.local-runtime');
writeFileSync('.local-runtime/pids.json', JSON.stringify(pids, null, 2));

console.log('[5/5] Waiting for service health...');
const apiLive = await waitForUrl(`http://${apiHost}:${apiPort}/health/live`, 'API live', timeout);
const apiReady = await waitForUrl(`http://${apiHost}:${apiPort}/health/ready`, 'API ready', timeout);
const scLive = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/live`, 'Scoring live', timeout);
const scReady = await waitForUrl(`http://${scoringHost}:${scoringPort}/health/ready`, 'Scoring ready', timeout);
const webOk = await waitForUrl(`http://${webHost}:${webPort}`, 'Web', timeout);

const workerOk = await workerReadyPromise;
if (workerOk) {
  console.log('  \u2713 Worker ready');
} else {
  console.error('  \u2717 Worker not ready');
}

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
