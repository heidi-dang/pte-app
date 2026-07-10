#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import { loadEnvLocal, getRequired } from './lib/local-env.mjs';

const env = loadEnvLocal();

const apiHost = getRequired(env, 'API_HOST');
const apiPort = getRequired(env, 'API_PORT');
const scoringHost = getRequired(env, 'SCORING_HOST');
const scoringPort = getRequired(env, 'SCORING_PORT');
const webPort = getRequired(env, 'WEB_PORT');
const webOrigin = env.WEB_ORIGIN || `http://localhost:${webPort}`;
const postgresUser = getRequired(env, 'POSTGRES_USER');
const postgresDb = getRequired(env, 'POSTGRES_DATABASE');
const logLevel = env.LOG_LEVEL || 'info';

console.log('[1/5] Checking environment...');
console.log('OK');

console.log('[2/5] Starting infrastructure...');
try {
  execSync('docker compose --env-file .env.local up -d', { stdio: 'inherit' });
} catch (e) {
  console.error('FAILED: Docker Compose could not start. Check Docker is running.');
  process.exit(1);
}
console.log('OK');

console.log('[3/5] Waiting for containers...');
try {
  execSync(`docker compose exec postgres pg_isready -U ${postgresUser} -d ${postgresDb}`, {
    stdio: 'pipe',
    timeout: 30000,
  });
} catch {
  console.error('FAILED: PostgreSQL did not become healthy.');
  process.exit(1);
}
console.log('OK');

console.log(`[4/5] Starting services...`);
console.log(`  API:      http://${apiHost}:${apiPort}`);
console.log(`  Scoring:  http://${scoringHost}:${scoringPort}`);
console.log(`  Worker:   npm run dev (in services/worker)`);
console.log(`  Web:      http://localhost:${webPort}`);

const services = [
  { name: 'api', cwd: 'services/api', cmd: 'npx', args: ['tsx', 'watch', 'src/main.ts'] },
  { name: 'scoring', cwd: 'services/scoring', cmd: 'npx', args: ['tsx', 'watch', 'src/main.ts'] },
  { name: 'worker', cwd: 'services/worker', cmd: 'npx', args: ['tsx', 'watch', 'src/main.ts'] },
  { name: 'web', cwd: 'apps/web', cmd: 'npx', args: ['next', 'dev', '--port', webPort] },
];

const children = [];
for (const svc of services) {
  const child = spawn(svc.cmd, svc.args, {
    cwd: svc.cwd,
    stdio: 'pipe',
    env: {
      ...process.env,
      ...env,
      API_HOST: apiHost,
      API_PORT: apiPort,
      SCORING_HOST: scoringHost,
      SCORING_PORT: scoringPort,
      WEB_PORT: webPort,
      WEB_ORIGIN: webOrigin,
    },
  });
  child.stdout.on('data', (d) => process.stdout.write(`[${svc.name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${svc.name}] ${d}`));
  child.on('exit', (code) => {
    console.error(`[${svc.name}] exited with code ${code}`);
    children.forEach((c) => !c.killed && c.kill());
    process.exit(1);
  });
  children.push(child);
}

console.log('[5/5] All services started. Press Ctrl+C to stop.');
console.log(`\n  Web:      http://localhost:${webPort}`);
console.log(`  API:      http://${apiHost}:${apiPort}/health/live`);
console.log(`  Scoring:  http://${scoringHost}:${scoringPort}/health/live`);

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  children.forEach((c) => !c.killed && c.kill());
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach((c) => !c.killed && c.kill());
  process.exit(0);
});
