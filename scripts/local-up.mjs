#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';

if (!existsSync('.env.local')) {
  console.error('FATAL: .env.local not found. Run: npm run setup:local');
  process.exit(1);
}

console.log('[1/5] Checking environment...');
try {
  execSync('node scripts/doctor.mjs', { stdio: 'pipe' });
} catch {
  console.error('Environment checks failed. Run: npm run doctor');
}
console.log('OK');

console.log('[2/5] Starting infrastructure...');
try {
  execSync('docker compose up -d', { stdio: 'inherit' });
} catch (e) {
  console.error('FAILED: Docker Compose could not start. Check Docker is running.');
  process.exit(1);
}
console.log('OK');

console.log('[3/5] Waiting for containers...');
try {
  execSync('docker compose exec postgres pg_isready -U pte_app -d pte_app', { stdio: 'pipe', timeout: 30000 });
} catch {
  console.error('FAILED: PostgreSQL did not become healthy.');
  process.exit(1);
}
console.log('OK');

const apiPort = process.env.API_PORT || '4000';
const scoringPort = process.env.SCORING_PORT || '5000';
const webPort = process.env.WEB_PORT || '3000';

console.log(`[4/5] Starting services...`);
console.log(`  API:      http://localhost:${apiPort}`);
console.log(`  Scoring:  http://localhost:${scoringPort}`);
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
    env: { ...process.env, WEB_PORT: webPort, API_PORT: apiPort, SCORING_PORT: scoringPort },
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
console.log(`  API:      http://localhost:${apiPort}/health/live`);
console.log(`  Scoring:  http://localhost:${scoringPort}/health/live`);

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  children.forEach((c) => !c.killed && c.kill());
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach((c) => !c.killed && c.kill());
  process.exit(0);
});
