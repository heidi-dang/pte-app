import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Reload the module fresh for each test by manipulating require cache
// Since config uses module-level state, we test via process.env

function loadConfig() {
  // Dynamic import to get fresh module evaluation
  return import('./config.js').then((m) => m.loadE2EConfig());
}

describe('E2E configuration', () => {

  const baseEnv: Record<string, string> = {
    E2E_WEB_URL: 'http://localhost:3000',
    E2E_API_URL: 'http://localhost:4000',
    E2E_DATABASE_HOST: 'localhost',
    E2E_DATABASE_PORT: '5432',
    E2E_DATABASE_NAME: 'pte_app',
    E2E_DATABASE_USER: 'pte_app',
    E2E_DATABASE_PASSWORD: 'local_dev_password_only',
    SESSION_COOKIE_NAME: 'pte_session',
  };

  function withEnv(vars: Record<string, string>, fn: () => Promise<void>) {
    const prev: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(vars)) {
      prev[k] = process.env[k];
      process.env[k] = v;
    }
    return fn().finally(() => {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });
  }

  it('loads valid configuration', async () => {
    await withEnv(baseEnv, async () => {
      const cfg = await loadConfig();
      assert.equal(cfg.webUrl, 'http://localhost:3000');
      assert.equal(cfg.apiUrl, 'http://localhost:4000');
      assert.equal(cfg.dbPort, 5432);
      assert.equal(cfg.cookieDomain, 'localhost');
      assert.equal(cfg.cookiePath, '/');
      assert.equal(cfg.cookieSecure, false);
      assert.equal(cfg.sessionCookieName, 'pte_session');
    });
  });

  it('derives cookie domain from hostname', async () => {
    await withEnv({ ...baseEnv, E2E_WEB_URL: 'http://127.0.0.1:3000' }, async () => {
      const cfg = await loadConfig();
      assert.equal(cfg.cookieDomain, '127.0.0.1');
    });
  });

  it('sets secure cookies for HTTPS', async () => {
    await withEnv({ ...baseEnv, E2E_WEB_URL: 'https://example.com' }, async () => {
      const cfg = await loadConfig();
      assert.equal(cfg.cookieSecure, true);
    });
  });

  it('rejects missing env var', async () => {
    await withEnv({ ...baseEnv, E2E_WEB_URL: '' }, async () => {
      await assert.rejects(loadConfig(), /E2E_WEB_URL/);
    });
  });

  it('rejects invalid web URL', async () => {
    await withEnv({ ...baseEnv, E2E_WEB_URL: 'not-a-url' }, async () => {
      await assert.rejects(loadConfig(), /not a valid absolute URL/);
    });
  });

  it('rejects invalid API URL', async () => {
    await withEnv({ ...baseEnv, E2E_API_URL: 'bad-url' }, async () => {
      await assert.rejects(loadConfig(), /not a valid absolute URL/);
    });
  });

  it('rejects database port out of range', async () => {
    await withEnv({ ...baseEnv, E2E_DATABASE_PORT: '0' }, async () => {
      await assert.rejects(loadConfig(), /between 1 and 65535/);
    });
    await withEnv({ ...baseEnv, E2E_DATABASE_PORT: '70000' }, async () => {
      await assert.rejects(loadConfig(), /between 1 and 65535/);
    });
    await withEnv({ ...baseEnv, E2E_DATABASE_PORT: 'abc' }, async () => {
      await assert.rejects(loadConfig(), /between 1 and 65535/);
    });
  });
});
