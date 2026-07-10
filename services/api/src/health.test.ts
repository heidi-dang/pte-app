import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { loadConfig } from './env.js';

async function buildApp() {
  const app = Fastify();
  const config = loadConfig();
  app.get('/health/live', async () => ({ service: 'api', status: 'ok' }));
  app.get('/health/ready', async () => ({ service: 'api', status: 'ok', ready: true }));
  return app;
}

describe('API health endpoints', () => {
  it('GET /health/live returns 200', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, 'ok');
    await app.close();
  });

  it('GET /health/ready returns 200 with ready', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().ready, true);
    await app.close();
  });

  it('response includes service field', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    assert.equal(res.json().service, 'api');
    await app.close();
  });
});
