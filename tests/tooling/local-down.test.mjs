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

  it('removes PID state when resolved', () => {
    assert.ok(downContent.includes('rmSync'));
  });

  it('preserves pids.json when unresolved entries exist', () => {
    assert.ok(downContent.includes('unresolvedEntries'));
    assert.ok(downContent.includes('preserved in pids.json'));
  });

  it('does not remove runtime directory when pids.json remains', () => {
    assert.ok(downContent.includes('!existsSync(pidsPath) && existsSync'));
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

  it('verifies process identity via cmdline', () => {
    assert.ok(downContent.includes('getActualCommandLine') || downContent.includes('cmdline'));
  });

  it('handles reused/mismatched PID', () => {
    assert.ok(downContent.includes('reused') || downContent.includes('different identity'));
  });

  it('handles unverifiable PID on unsupported platforms', () => {
    assert.ok(downContent.includes('cannot verify process identity'));
  });

  it('handles enhanced PID format', () => {
    assert.ok(downContent.includes('commandMarker') || downContent.includes('entry.pid'));
  });

  it('is async main function with catch', () => {
    assert.ok(downContent.includes('async function main'));
    assert.ok(downContent.includes('main().catch'));
  });
});
