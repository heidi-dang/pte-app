import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '../..');

describe('Environment parsing', () => {
  it('.env.example exists', () => {
    assert.ok(existsSync(join(root, '.env.example')));
  });

  it('.env.example contains required variables', () => {
    const content = readFileSync(join(root, '.env.example'), 'utf-8');
    const required = [
      'NODE_ENV',
      'WEB_HOST',
      'WEB_PORT',
      'API_HOST',
      'API_PORT',
      'SCORING_HOST',
      'SCORING_PORT',
      'POSTGRES_HOST',
      'POSTGRES_PORT',
      'POSTGRES_DATABASE',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'REDIS_HOST',
      'REDIS_PORT',
      'LOG_LEVEL',
      'APP_VERSION',
    ];
    for (const v of required) {
      assert.ok(content.includes(v), `Missing required env var: ${v}`);
    }
  });
});

describe('Setup script', () => {
  it('creates .env.local from .env.example when missing', () => {
    const script = readFileSync(join(root, 'scripts/setup-local.mjs'), 'utf-8');
    assert.ok(script.includes('.env.example'));
    assert.ok(script.includes('.env.local'));
  });
});

describe('Workspace validator', () => {
  it('detects missing workspace', () => {
    const script = readFileSync(join(root, 'scripts/validate-workspace.mjs'), 'utf-8');
    assert.ok(script.includes('Missing workspace'));
    assert.ok(script.includes('requiredWorkspaces'));
  });
});
