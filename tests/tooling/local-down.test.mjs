import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const downScript = join(root, 'scripts/local-down.mjs');
const downContent = readFileSync(downScript, 'utf-8');

describe('local-down script structure', () => {
  it('loads .env.local', () => {
    assert.ok(downContent.includes('.env.local'));
  });

  it('reads PID state', () => {
    assert.ok(downContent.includes('pids.json'));
  });

  it('sends SIGTERM to processes', () => {
    assert.ok(downContent.includes('SIGTERM'));
  });

  it('has SIGKILL fallback', () => {
    assert.ok(downContent.includes('SIGKILL'));
  });

  it('confirms SIGKILL with liveness check', () => {
    assert.ok(downContent.includes('SIGKILL') && downContent.includes('still alive'));
  });

  it('removes PID state', () => {
    assert.ok(downContent.includes('rmSync') || downContent.includes('unlink'));
  });

  it('removes empty runtime directory', () => {
    assert.ok(downContent.includes('.local-runtime'));
  });

  it('runs docker compose down', () => {
    assert.ok(downContent.includes('docker compose'));
  });

  it('preserves volumes', () => {
    const downLine = downContent.split('\n').filter((l) => l.includes("'down'") || l.includes(' down '))[0] || '';
    assert.ok(!downLine.includes('-v'), `compose down line should not contain -v: ${downLine}`);
  });

  it('prints destructive reset command', () => {
    assert.ok(downContent.includes('docker compose') && downContent.includes('-v'));
  });

  it('verifies process identity via /proc/cmdline on Linux', () => {
    assert.ok(downContent.includes('/proc') || downContent.includes('cmdline'));
  });

  it('handles reused/mismatched PID', () => {
    assert.ok(downContent.includes('reused') || downContent.includes('different identity'));
  });

  it('handles enhanced PID format (object with pid, service, commandMarker)', () => {
    assert.ok(downContent.includes('commandMarker') || downContent.includes('entry.pid'));
  });
});
