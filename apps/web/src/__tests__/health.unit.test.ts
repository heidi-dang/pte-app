import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { getHealthConfig, checkService, getHealthUrl } from '../lib/health.ts';

function startOkServer(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
    server.listen(0, () => {
      const addr = server.address();
      resolve({ server, port: addr && typeof addr === 'object' ? addr.port : 0 });
    });
  });
}

function startFailServer(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(500);
      res.end('Internal Server Error');
    });
    server.listen(0, () => {
      const addr = server.address();
      resolve({ server, port: addr && typeof addr === 'object' ? addr.port : 0 });
    });
  });
}

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

describe('checkService with real HTTP server', () => {
  let okServer: Server;
  let okPort: number;
  let failServer: Server;
  let failPort: number;

  before(async () => {
    const ok = await startOkServer();
    okServer = ok.server;
    okPort = ok.port;
    const fail = await startFailServer();
    failServer = fail.server;
    failPort = fail.port;
  });

  after(() => {
    okServer?.close();
    failServer?.close();
  });

  it('HTTP 200 returns ok', async () => {
    const result = await checkService(`http://localhost:${okPort}`);
    assert.equal(result, 'ok');
  });

  it('HTTP 500 returns fail', async () => {
    const result = await checkService(`http://localhost:${failPort}`);
    assert.equal(result, 'fail');
  });

  it('Network error returns fail', async () => {
    const result = await checkService('http://localhost:1');
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
