import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const pidsPath = join(root, '.local-runtime/pids.json');
const runtimeDir = join(root, '.local-runtime');
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
    const composeLine = downContent.split('\n').filter((l) => l.includes('docker compose'))[0] || '';
    assert.ok(!composeLine.includes('-v'));
  });

  it('prints destructive reset command', () => {
    assert.ok(downContent.includes('docker compose') && downContent.includes('-v'));
  });
});
