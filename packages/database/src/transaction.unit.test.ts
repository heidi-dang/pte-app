import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withTransaction } from './transaction.js';
import type { DatabaseConnection, DatabaseClient } from './client.js';

function createMockConnection(recorded: string[]): DatabaseConnection {
  const client = {
    query: async (sql: string) => {
      recorded.push(sql);
      if (sql === 'THROW') throw new Error('boom');
      return { rows: [] };
    },
    release: () => {
      recorded.push('release');
    },
  } as unknown as DatabaseClient;

  return {
    pool: {
      connect: async () => client,
    },
    config: {} as DatabaseConnection['config'],
    close: async () => {},
  } as unknown as DatabaseConnection;
}

describe('transaction', () => {
  it('commits on success', async () => {
    const recorded: string[] = [];
    const connection = createMockConnection(recorded);

    const result = await withTransaction(connection, async () => {
      return 'done';
    });

    assert.equal(result, 'done');
    assert.deepEqual(recorded, ['BEGIN', 'COMMIT', 'release']);
  });

  it('rolls back on failure', async () => {
    const recorded: string[] = [];
    const connection = createMockConnection(recorded);

    await assert.rejects(
      async () =>
        withTransaction(connection, async (client) => {
          await client.query('THROW');
        }),
      /boom/,
    );

    assert.deepEqual(recorded, ['BEGIN', 'THROW', 'ROLLBACK', 'release']);
  });
});
