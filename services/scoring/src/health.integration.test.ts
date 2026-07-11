import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './env.js';
import { buildApp, type App } from './app.js';
import { createServer } from 'node:net';

describe('Scoring network integration', () => {
  let app: App;
  let port: number;

  before(async () => {
    app = await buildApp(loadConfig());
    await app.listen({ host: '127.0.0.1', port: 0 });
    const addr = app.server.address();
    port = addr && typeof addr === 'object' ? addr.port : 0;
  });

  after(async () => {
    await app.close();
    await new Promise<void>((resolve) => {
      const s = createServer();
      s.once('error', () => {
        s.close();
        resolve();
      });
      s.once('listening', () => {
        s.close();
        resolve();
      });
      s.listen(port, '127.0.0.1');
    });
  });

  it('live route returns 200', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'scoring');
  });

  it('ready route returns 200', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ready, true);
    assert.equal(body.foundationOnly, true);
  });

  it('allows configured CORS origin', async () => {
    const config = loadConfig();
    const res = await fetch(`http://127.0.0.1:${port}/health/live`, {
      headers: { origin: config.webOrigin },
    });
    assert.equal(res.headers.get('access-control-allow-origin'), config.webOrigin);
  });

  it('rejects disallowed CORS origin', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`, {
      headers: { origin: 'https://evil.example.com' },
    });
    const header = res.headers.get('access-control-allow-origin');
    assert.ok(!header || header !== 'https://evil.example.com');
  });
});
