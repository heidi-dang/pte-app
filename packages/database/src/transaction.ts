import type { DatabaseClient, DatabaseConnection } from './client.js';

export type TransactionCallback<T> = (client: DatabaseClient) => Promise<T>;

export async function withTransaction<T>(connection: DatabaseConnection, callback: TransactionCallback<T>): Promise<T> {
  const client = await connection.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
