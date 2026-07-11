#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

let exitCode = 0;
const results = [];

function check(label, fn) {
  try {
    const pass = fn();
    results.push({ label, status: pass ? 'PASS' : 'FAIL' });
    if (!pass) exitCode = 1;
  } catch (e) {
    results.push({ label, status: 'FAIL', detail: e.message });
    exitCode = 1;
  }
}

function warn(label, msg) {
  results.push({ label, status: 'WARN', detail: msg });
}

check('Node.js version', () => {
  const m = process.version.match(/^v(\d+)/);
  return m && parseInt(m[1]) >= 24;
});

check('npm available', () => {
  execSync('npm --version', { stdio: 'pipe' });
  return true;
});

check('Workspace installed', () => existsSync('node_modules'));

check('.env.local exists', () => existsSync('.env.local'));

check('DATABASE_URL defined in .env.local', () => {
  if (!existsSync('.env.local')) return false;
  const content = readFileSync('.env.local', 'utf-8');
  return (
    content.includes('DATABASE_URL') &&
    content.includes('BCRYPT_COST') &&
    content.includes('AUTH_MAX_FAILED_ATTEMPTS') &&
    content.includes('AUTH_LOCKOUT_SECONDS') &&
    content.includes('SESSION_IDLE_TIMEOUT_SECONDS')
  );
});

check('Docker available', () => {
  execSync('docker --version', { stdio: 'pipe' });
  return true;
});

check('Docker Compose available', () => {
  execSync('docker compose version', { stdio: 'pipe' });
  return true;
});

try {
  const pg = execSync('docker inspect pte-postgres --format={{.State.Health.Status}}', {
    stdio: 'pipe',
    encoding: 'utf-8',
  }).trim();
  if (pg !== 'healthy') warn('PostgreSQL container', `Status: ${pg}. Run: docker compose up -d`);
  else check('PostgreSQL container', () => true);
} catch {
  warn('PostgreSQL container', 'Not running. Run: docker compose up -d');
}

try {
  const rd = execSync('docker inspect pte-redis --format={{.State.Health.Status}}', {
    stdio: 'pipe',
    encoding: 'utf-8',
  }).trim();
  if (rd !== 'healthy') warn('Redis container', `Status: ${rd}. Run: docker compose up -d`);
  else check('Redis container', () => true);
} catch {
  warn('Redis container', 'Not running. Run: docker compose up -d');
}

for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : r.status === 'WARN' ? '⚠' : '✗';
  console.log(`  ${icon} [${r.status}] ${r.label}${r.detail ? ': ' + r.detail : ''}`);
}

process.exit(exitCode);
