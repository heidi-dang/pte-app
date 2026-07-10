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

// Check for alternate lockfiles
for (const lf of ['pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock']) {
  if (existsSync(lf)) errors.push(`Unexpected lockfile: ${lf}`);
}

// Check tracked .env files (should be .env.example only)
try {
  const git = readFileSync('.gitignore', 'utf-8');
  if (!git.includes('.env.local')) errors.push('.gitignore must include .env.local');
} catch {
  errors.push('Missing .gitignore');
}

// Check Phase C not started
const phaseCDirs = ['packages/domain', 'packages/contracts', 'packages/schemas'];
for (const d of phaseCDirs) {
  if (existsSync(d)) errors.push(`Phase C directory detected: ${d}`);
}

// Check root scripts
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

if (errors.length === 0) {
  console.log('Workspace validation: All checks passed.');
} else {
  for (const e of errors) console.error(`  ERROR: ${e}`);
  process.exit(1);
}
