import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';

async function buildApp() {
  const app = Fastify();
  app.get('/health/live', async () => ({ service: 'scoring', status: 'ok', foundationOnly: true }));
  app.get('/health/ready', async () => ({ service: 'scoring', status: 'ok', foundationOnly: true }));
  return app;
}

describe('Scoring health endpoints', () => {
  it('GET /health/live returns 200', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, 'ok');
    await app.close();
  });

  it('GET /health/ready returns 200', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().foundationOnly, true);
    await app.close();
  });
});
