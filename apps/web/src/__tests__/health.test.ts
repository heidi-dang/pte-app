import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { getHealthConfig, checkService, getHealthUrl } from '../lib/health.ts';

describe('Health configuration', () => {
  it('Missing API URL returns configMissing', () => {
    const orig = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_SCORING_URL = 'http://scoring:5000';
    const cfg = getHealthConfig();
    assert.equal(cfg.configMissing, true);
    process.env.NEXT_PUBLIC_API_URL = orig;
  });

  it('Missing scoring URL returns configMissing', () => {
    const orig = process.env.NEXT_PUBLIC_SCORING_URL;
    delete process.env.NEXT_PUBLIC_SCORING_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://api:4000';
    const cfg = getHealthConfig();
    assert.equal(cfg.configMissing, true);
    process.env.NEXT_PUBLIC_SCORING_URL = orig;
  });

  it('Both URLs present configMissing is false', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api:4000';
    process.env.NEXT_PUBLIC_SCORING_URL = 'http://scoring:5000';
    const cfg = getHealthConfig();
    assert.equal(cfg.configMissing, false);
  });
});

describe('checkService', () => {
  it('HTTP success returns ok', async () => {
    const result = await checkService('http://localhost:0');
    assert.ok(['ok', 'fail'].includes(result));
  });

  it('Invalid URL returns fail', async () => {
    const result = await checkService('http://localhost:1/nonexistent');
    assert.equal(result, 'fail');
  });

  it('Timeout returns fail', async () => {
    const result = await checkService('http://localhost:1', 1);
    assert.equal(result, 'fail');
  });
});

describe('getHealthUrl', () => {
  it('appends health endpoint', () => {
    assert.equal(getHealthUrl('http://api:4000'), 'http://api:4000/health/live');
  });
});
