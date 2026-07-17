import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnvLocal } from '@pte-app/database/testing/env';
applyEnvLocal();
if (!process.env.POSTGRES_HOST) process.env.POSTGRES_HOST = 'localhost';
if (!process.env.POSTGRES_USER) process.env.POSTGRES_USER = 'test';
if (!process.env.POSTGRES_DB) process.env.POSTGRES_DB = 'test';
import { loadConfig } from './env.js';
import { buildApp } from './app.js';

describe('API health endpoints', () => {
  const config = loadConfig();

  it('GET /health/live returns 200', async () => {
    const app = await buildApp(config, { skipDb: true });
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, 'ok');
    await app.close();
  });

  it('GET /health/ready returns 200 with ready', async () => {
    const app = await buildApp(config, { skipDb: true });
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().ready, true);
    await app.close();
  });

  it('response includes service and version fields', async () => {
    const app = await buildApp(config, { skipDb: true });
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    assert.equal(res.json().service, 'api');
    assert.equal(typeof res.json().version, 'string');
    assert.equal(typeof res.json().timestamp, 'string');
    await app.close();
  });

  it('CORS allowed origin receives Access-Control-Allow-Origin', async () => {
    const app = await buildApp(config, { skipDb: true });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: { origin: config.webOrigin },
    });
    assert.equal(res.headers['access-control-allow-origin'], config.webOrigin);
    await app.close();
  });

  it('graceful close works', async () => {
    const app = await buildApp(config, { skipDb: true });
    await app.close();
    assert.ok(true, 'close completed without error');
  });
});
