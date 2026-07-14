import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkHealth } from './health.js';
import type { DatabaseConnection } from './client.js';

describe('database health', () => {
  it('returns healthy when query succeeds', async () => {
    const connection = {
      pool: {
        query: async () => ({ rows: [{ ok: 1 }] }),
      },
      config: {} as DatabaseConnection['config'],
      close: async () => {},
    } as unknown as DatabaseConnection;

    const result = await checkHealth(connection);
    assert.equal(result.healthy, true);
    assert.ok(result.latencyMs >= 0);
  });

  it('returns unhealthy when query fails', async () => {
    const connection = {
      pool: {
        query: async () => {
          throw new Error('connection refused');
        },
      },
      config: {} as DatabaseConnection['config'],
      close: async () => {},
    } as unknown as DatabaseConnection;

    const result = await checkHealth(connection);
    assert.equal(result.healthy, false);
    assert.ok(result.error?.includes('connection refused'));
  });

  it('returns unhealthy for unexpected result', async () => {
    const connection = {
      pool: {
        query: async () => ({ rows: [{ ok: 0 }] }),
      },
      config: {} as DatabaseConnection['config'],
      close: async () => {},
    } as unknown as DatabaseConnection;

    const result = await checkHealth(connection);
    assert.equal(result.healthy, false);
  });
});
