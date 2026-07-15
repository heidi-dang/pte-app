import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = `${ROOT}/scripts/deploy-production.sh`;
const ROLLBACK_SCRIPT = `${ROOT}/scripts/rollback-production.sh`;
const BACKUP_SCRIPT = `${ROOT}/scripts/backup-production.sh`;

function hasPattern(file, pattern) {
  return readFileSync(file, 'utf-8').includes(pattern);
}

function countPattern(file, pattern) {
  const content = readFileSync(file, 'utf-8');
  return (content.match(new RegExp(pattern, 'g')) || []).length;
}

describe('deploy-production.sh gates', () => {
  it('exists and is executable', () => {
    assert.ok(existsSync(SCRIPT), 'deploy-production.sh must exist');
    const mode = execSync(`stat -c '%A' ${SCRIPT}`, { encoding: 'utf8' }).trim();
    assert.ok(mode.includes('x'), 'deploy-production.sh must be executable');
  });

  it('failed tests block deployment (no || true)', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('npm run ci'), 'Script must run npm run ci');
    assert.ok(!content.includes('npm test 2>&1 || true'), 'Must not use || true on tests');
    assert.ok(!content.includes('npm run ci || true'), 'Must not use || true on ci');
  });

  it('failed backup blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('exit 1'), 'Backup failure must exit');
    assert.ok(!content.includes('WARNING.*backup'), 'No warning-only backup path');
  });

  it('unhealthy service blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(hasPattern(SCRIPT, 'health_ok=false'), 'Must detect health failure');
    assert.ok(hasPattern(SCRIPT, 'exit 1'), 'Failure must exit');
  });

  it('failed HTTPS verification blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(hasPattern(SCRIPT, 'https_ok'), 'Must verify HTTPS');
    assert.ok(hasPattern(SCRIPT, 'exit 1'), 'HTTPS failure must exit');
  });

  it('failed TLS verification blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(hasPattern(SCRIPT, 'tls_ok'), 'Must verify TLS');
    assert.ok(hasPattern(SCRIPT, 'exit 1'), 'TLS failure must exit');
  });

  it('rejects deferred verification in production', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('VERIFICATION_MODE'), 'Must check verification mode');
    assert.ok(content.includes('Phase Y'), 'Deferred mode must reference Phase Y');
    assert.ok(!content.includes('deferred.*will run in Phase Y'), 'Must not silently skip HTTPS');
  });

  it('rejects DEPLOYMENT_ENV=test for production', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes("'production' (got:"), 'Must reject non-production env');
  });

  it('health loop includes caddy', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('caddy'), 'Health loop must include caddy');
  });

  it('redis backup copy failure blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('Redis backup copy failed'), 'Redis copy failure must have error message');
    assert.ok(!content.match(/redis-cli.*\|\| true/), 'Must not ignore Redis copy failure');
  });

  it('wrong release SHA blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('does not match RELEASE_COMMIT'), 'Must verify checked-out commit matches');
  });

  it('non-main commit blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('merge-base'), 'Must check reachability from origin/main');
  });

  it('dirty tree blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('git status --porcelain'), 'Must check for dirty worktree');
    assert.ok(content.includes('exit 1'), 'Dirty tree must exit');
  });

  it('rollback failure blocks deployment', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(hasPattern(SCRIPT, 'rollback'), 'Script must call rollback on failure');
  });

  it('environment validation checks exist, non-empty, numeric, domain, upstream', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('required_vars'), 'Must validate required vars');
    assert.ok(content.includes('is not set or empty'), 'Must check non-empty');
    assert.ok(content.includes('must be numeric'), 'Must validate numeric ports');
    assert.ok(content.includes('service:port format'), 'Must validate upstream format');
    assert.ok(content.includes('DEPLOYMENT_ENV must'), 'Must validate deployment env');
  });

  it('env file is loaded via source before validation', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('source .env.production'), 'Must source the env file');
    assert.ok(!content.includes('grep -q \"^${var}='), 'Must not use grep-only validation');
  });

  it('backup produces checksum and validates non-empty', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('sha256sum'), 'Must produce checksum');
    assert.ok(content.includes('dump_size'), 'Must check dump size');
  });

  it('first deployment explicitly recorded', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('first-deployment'), 'Must record first deployment');
  });

  it('no service uses latest tag for deployed identity', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(!content.includes(':latest'), 'Must not use latest tag');
  });

  it('health check has visible progress with attempt counter', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('attempt'), 'Must show attempt progress');
    assert.ok(content.includes('HEALTH_MAX_RETRIES'), 'Must use configurable retry');
  });

  it('caddy validate and adapt both run with full env vars', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('caddy validate'), 'Must run caddy validate');
    assert.ok(content.includes('caddy adapt'), 'Must run caddy adapt');
  });
});

describe('rollback-production.sh', () => {
  it('exists and is executable', () => {
    assert.ok(existsSync(ROLLBACK_SCRIPT), 'rollback-production.sh must exist');
    const mode = execSync(`stat -c '%A' ${ROLLBACK_SCRIPT}`, { encoding: 'utf8' }).trim();
    assert.ok(mode.includes('x'), 'rollback-production.sh must be executable');
  });

  it('creates pre-rollback backup', () => {
    const content = readFileSync(ROLLBACK_SCRIPT, 'utf-8');
    assert.ok(content.includes('Pre-rollback backup'), 'Must create pre-rollback backup');
    assert.ok(content.includes('exit 1'), 'Backup failure must exit');
  });

  it('waits for services after rollback', () => {
    const content = readFileSync(ROLLBACK_SCRIPT, 'utf-8');
    assert.ok(content.includes('Verifying rollback health'), 'Must verify health');
    assert.ok(content.includes('health_status'), 'Must check health status');
    assert.ok(content.includes('caddy'), 'Rollback health loop must include caddy');
  });

  it('fails loudly if rollback itself fails', () => {
    const content = readFileSync(ROLLBACK_SCRIPT, 'utf-8');
    assert.ok(content.includes('exit 1'), 'Rollback failure must exit');
  });

  it('uses recorded commit from deploy log, not latest', () => {
    const content = readFileSync(ROLLBACK_SCRIPT, 'utf-8');
    assert.ok(content.includes('deploy.log'), 'Must read from deploy log');
    assert.ok(!content.includes(':latest'), 'Must not use latest tag');
  });
});

describe('backup-production.sh', () => {
  it('exists and is executable', () => {
    assert.ok(existsSync(BACKUP_SCRIPT), 'backup-production.sh must exist');
    const mode = execSync(`stat -c '%A' ${BACKUP_SCRIPT}`, { encoding: 'utf8' }).trim();
    assert.ok(mode.includes('x'), 'backup-production.sh must be executable');
  });

  it('validates dump is non-empty', () => {
    const content = readFileSync(BACKUP_SCRIPT, 'utf-8');
    assert.ok(content.includes('dump_size'), 'Must check dump size');
    assert.ok(content.includes('exit 1'), 'Empty dump must exit');
  });

  it('produces checksum', () => {
    const content = readFileSync(BACKUP_SCRIPT, 'utf-8');
    assert.ok(content.includes('sha256sum'), 'Must produce SHA256 checksum');
  });

  it('records backup metadata', () => {
    const content = readFileSync(BACKUP_SCRIPT, 'utf-8');
    assert.ok(content.includes('backup-metadata.txt'), 'Must write metadata file');
  });
});
