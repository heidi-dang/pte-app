#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let errors = [];
const requiredWorkspaces = [
  'apps/web',
  'services/api',
  'services/scoring',
  'services/worker',
  'packages/eslint-config',
  'packages/typescript-config',
];

for (const ws of requiredWorkspaces) {
  if (!existsSync(join(ws, 'package.json'))) errors.push(`Missing workspace: ${ws}`);
}

for (const lf of ['pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock']) {
  if (existsSync(lf)) errors.push(`Unexpected lockfile: ${lf}`);
}

try {
  const git = readFileSync('.gitignore', 'utf-8');
  if (!git.includes('.env.local')) errors.push('.gitignore must include .env.local');
} catch {
  errors.push('Missing .gitignore');
}

const phaseCDirs = ['packages/domain', 'packages/contracts', 'packages/schemas'];
for (const d of phaseCDirs) {
  if (existsSync(d)) errors.push(`Phase C directory detected: ${d}`);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const requiredScripts = [
  'setup:local',
  'doctor',
  'dev',
  'local:up',
  'local:down',
  'local:smoke',
  'format',
  'lint',
  'typecheck',
  'test:docs',
  'validate:docs',
  'validate:workspace',
  'test:tooling',
  'test:unit',
  'test:integration',
  'test:e2e',
  'test',
  'build',
  'ci',
];
for (const s of requiredScripts) {
  if (!pkg.scripts?.[s]) errors.push(`Missing root script: ${s}`);
}

/* ---- Phase B contract rules ---- */

// 1. workerOk must be included in allOk (local-up.mjs)
const localUp = readFileSync('scripts/local-up.mjs', 'utf-8');
if (!localUp.includes('workerOk')) {
  errors.push('local-up.mjs: workerOk must be defined');
}
if (!localUp.includes('allOk =') || !localUp.match(/allOk\s*=.*workerOk/)) {
  errors.push('local-up.mjs: workerOk must be included in allOk');
}

// 2. Worker readiness must use stdout event detection, not only check script
if (!localUp.includes('worker_ready')) {
  errors.push('local-up.mjs: worker readiness must detect worker_ready event from stdout');
}
if (localUp.match(/waitForWorkerReady/) && !localUp.includes('worker_ready')) {
  errors.push('local-up.mjs: worker readiness must not rely only on check script');
}

// 3. Direct lifecycle process.exit() after children exist
const processExitLines = localUp
  .split('\n')
  .map((line, i) => ({ line, num: i + 1 }))
  .filter(({ line }) => line.match(/process\.exit\(/) && !line.trim().startsWith('//'));
const childrenStartLine = localUp.split('\n').findIndex((l) => l.includes('Starting services'));
for (const { line, num } of processExitLines) {
  if (num > childrenStartLine + 10) {
    errors.push(`local-up.mjs:${num} direct process.exit() after child creation - must use shutdown()`);
  }
}
// Check that shutdown function exists and handles children
if (!localUp.includes('async function shutdown')) {
  errors.push('local-up.mjs: must have a shared async shutdown function');
}
if (!localUp.includes('SIGTERM')) {
  errors.push('local-up.mjs: shutdown must send SIGTERM to children');
}
if (!localUp.includes('SIGKILL')) {
  errors.push('local-up.mjs: shutdown must have SIGKILL fallback');
}

// 4. Incomplete local-down
const localDown = readFileSync('scripts/local-down.mjs', 'utf-8');
if (!localDown.includes('pids.json')) {
  errors.push('local-down.mjs: must read PID state');
}
if (!localDown.includes('SIGTERM')) {
  errors.push('local-down.mjs: must send SIGTERM to tracked processes');
}
if (!localDown.includes('docker compose')) {
  errors.push('local-down.mjs: must run docker compose down');
}
if (!localDown.includes('.env.local')) {
  errors.push('local-down.mjs: must load .env.local');
}

// 5. Worker tests must spawn real processes
const workerTestFiles = [];
for (const f of ['services/worker/src/worker.integration.test.ts', 'services/worker/src/worker.unit.test.ts']) {
  if (existsSync(f)) workerTestFiles.push(f);
}
for (const f of workerTestFiles) {
  const content = readFileSync(f, 'utf-8');
  if (!content.includes('spawn') && content.includes('describe')) {
    errors.push(`${f}: worker behavioural tests must spawn child processes`);
  }
}

// 6. Overlapping unit/integration test globs
const serviceDirs = ['apps/web', 'services/api', 'services/scoring', 'services/worker'];
for (const dir of serviceDirs) {
  const wsPkgPath = join(dir, 'package.json');
  if (!existsSync(wsPkgPath)) continue;
  const wsPkg = JSON.parse(readFileSync(wsPkgPath, 'utf-8'));
  const unitGlob = wsPkg.scripts?.['test:unit'] || '';
  const intGlob = wsPkg.scripts?.['test:integration'] || '';
  if (unitGlob && intGlob && unitGlob === intGlob) {
    errors.push(`${dir}: test:unit (${unitGlob}) and test:integration (${intGlob}) must not be identical`);
  }
  // Check that unit glob does NOT match integration pattern
  if (unitGlob.includes('*') && intGlob.includes('*')) {
    const unitFiles = unitGlob.replace(/--test\s*/, '').trim();
    const intFiles = intGlob.replace(/--test\s*/, '').trim();
    if (unitFiles === intFiles) {
      errors.push(`${dir}: unit and integration globs must be distinct (both use ${unitFiles})`);
    }
  }
}

// 7. Web success test must not accept both ok and fail
const webUnitTestPath = 'apps/web/src/__tests__/health.unit.test.ts';
if (existsSync(webUnitTestPath)) {
  const webTest = readFileSync(webUnitTestPath, 'utf-8');
  if (webTest.includes("['ok', 'fail']") || webTest.includes("'ok','fail'") || webTest.includes("['ok','fail']")) {
    errors.push('web health.unit.test.ts: HTTP success test must not accept both ok and fail');
  }
  if (!webTest.includes('HTTP 200') && !webTest.includes('server')) {
    errors.push('web health.unit.test.ts: must test with a real HTTP server');
  }
}

// 8. Missing network integration files
const expectedIntegration = [
  'services/api/src/health.integration.test.ts',
  'services/scoring/src/health.integration.test.ts',
  'apps/web/src/__tests__/health.integration.test.ts',
];
for (const f of expectedIntegration) {
  if (!existsSync(f)) errors.push(`Missing network integration file: ${f}`);
}
for (const f of expectedIntegration) {
  if (existsSync(f)) {
    const content = readFileSync(f, 'utf-8');
    if (content.includes('app.inject') || content.includes('.inject(')) {
      errors.push(`${f}: must use real network requests (fetch), not Fastify inject`);
    }
    if (!content.includes('fetch(') && !content.includes('http')) {
      errors.push(`${f}: must use real HTTP network requests`);
    }
  }
}

// 9. Worker readiness listener attached at spawn time (no preliminary polling loop)
if (localUp.includes('workerStart') && localUp.match(/while.*workerStart/)) {
  errors.push(
    'local-up.mjs: must not have preliminary worker readiness polling loop - use createWorkerReadyPromise at spawn',
  );
}
if (!localUp.includes('createWorkerReadyPromise')) {
  errors.push('local-up.mjs: must use createWorkerReadyPromise attached during spawn');
}

// 10. Shutdown must await final exit after SIGKILL
if (!localUp.includes("child.once('close'") && !localUp.includes("child.once('close'")) {
  // Check for close listener in shutdown
  const closeCheck = localUp.match(/on\(['"]close['"]/);
  if (!closeCheck) {
    errors.push('local-up.mjs: shutdown must await close/exit after SIGKILL');
  }
}

// 11. Invalid-configuration test must assert non-zero
const workerTestPath = 'services/worker/src/worker.integration.test.ts';
if (existsSync(workerTestPath)) {
  const wt = readFileSync(workerTestPath, 'utf-8');
  const lines = wt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('invalid required configuration')) {
      // Check that next assertion is notEqual
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('assert.equal(code, 0)') && !lines[j].includes('assert.notEqual')) {
          errors.push(`worker integration test:${j + 1} invalid config test must use assert.notEqual(code, 0)`);
        }
      }
    }
  }
  if (wt.includes('worker_shutdown || exitCode === 0') || wt.includes("worker_shutdown' || code === 0")) {
    errors.push('worker integration test: signal tests must require BOTH worker_shutdown AND exit code 0, not ||');
  }
}

// 12. No readFileSync on .local-runtime directory
if (localUp.includes("readFileSync('.local-runtime'") || localUp.includes('readFileSync(`.local-runtime')) {
  errors.push('local-up.mjs: must use readdirSync, not readFileSync, to check .local-runtime directory');
}

// 13. SIGKILL confirmation in shutdown
if (!localUp.includes('Final liveness')) {
  errors.push('local-up.mjs: shutdown must have final liveness check after SIGKILL');
}

// 14. Port verification in shutdown
if (!localUp.includes('isPortOpen') || !localUp.includes('API port')) {
  errors.push('local-up.mjs: shutdown must verify API/scoring/web ports released');
}

if (errors.length === 0) {
  console.log('Workspace validation: All checks passed.');
} else {
  for (const e of errors) console.error(`  ERROR: ${e}`);
  process.exit(1);
}
