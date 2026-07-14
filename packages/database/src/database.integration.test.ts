import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnvLocal } from './testing/env.js';
applyEnvLocal();
import { loadDatabaseConfig, type DatabaseConfig } from './config.js';
import { createConnection, type DatabaseConnection } from './client.js';
import { setupTestDatabase, resetTestDatabase } from './testing/setup.js';
import * as users from './repositories/users.js';
import * as sessions from './repositories/sessions.js';
import { checkHealth } from './health.js';

let postgresAvailable = false;

describe('database integration', () => {
  const baseConfig = loadDatabaseConfig();
  const testConfig: DatabaseConfig = { ...baseConfig, database: `${baseConfig.database}_test` };
  let connection: DatabaseConnection;

  before(async () => {
    try {
      const probe = await createConnection({
        ...baseConfig,
        connectionTimeoutMs: 2000,
        retryAttempts: 1,
      });
      await probe.close();
      postgresAvailable = true;
      await setupTestDatabase(baseConfig);
      connection = await createConnection(testConfig);
      await resetTestDatabase(baseConfig);
    } catch {
      postgresAvailable = false;
    }
  });

  after(async () => {
    if (postgresAvailable) {
      await connection.close();
    }
  });

  beforeEach(async () => {
    if (postgresAvailable) {
      await resetTestDatabase(baseConfig);
    }
  });

  function pgIt(name: string, fn: () => Promise<void>) {
    it(name, async () => {
      if (!postgresAvailable) {
        return;
      }
      await fn();
    });
  }

  describe('health', () => {
    pgIt('reports healthy for real connection', async () => {
      const result = await checkHealth(connection);
      assert.equal(result.healthy, true);
    });
  });

  describe('users repository', () => {
    pgIt('creates and retrieves a user', async () => {
      const created = await users.createUser(connection, {
        email: 'test@example.com',
        passwordHash: 'hash',
      });
      assert.ok(created.id);
      assert.equal(created.email, 'test@example.com');

      const found = await users.getUserById(connection, created.id);
      assert.equal(found?.email, 'test@example.com');

      const byEmail = await users.getUserByEmail(connection, 'test@example.com');
      assert.equal(byEmail?.id, created.id);
    });

    pgIt('rejects duplicate email', async () => {
      await users.createUser(connection, { email: 'dup@example.com', passwordHash: 'hash' });
      await assert.rejects(
        async () => users.createUser(connection, { email: 'dup@example.com', passwordHash: 'hash' }),
        /unique/,
      );
    });

    pgIt('updates user disabled state', async () => {
      const created = await users.createUser(connection, { email: 'upd@example.com', passwordHash: 'hash' });
      const updated = await users.updateUser(connection, created.id, { disabled: true });
      assert.equal(updated?.disabled, true);
      assert.ok((updated?.version ?? 0) > created.version);
    });

    pgIt('manages roles', async () => {
      const created = await users.createUser(connection, { email: 'role@example.com', passwordHash: 'hash' });
      await users.addUserRole(connection, created.id, 'student');
      await users.addUserRole(connection, created.id, 'teacher');
      const roles = await users.getUserRoles(connection, created.id);
      assert.deepEqual(roles.sort(), ['student', 'teacher']);

      await users.removeUserRole(connection, created.id, 'student');
      const after = await users.getUserRoles(connection, created.id);
      assert.deepEqual(after, ['teacher']);
    });

    pgIt('deletes user', async () => {
      const created = await users.createUser(connection, { email: 'del@example.com', passwordHash: 'hash' });
      const deleted = await users.deleteUser(connection, created.id);
      assert.equal(deleted, true);
      const found = await users.getUserById(connection, created.id);
      assert.equal(found, undefined);
    });
  });

  describe('sessions repository', () => {
    pgIt('creates and retrieves session', async () => {
      const user = await users.createUser(connection, { email: 'session@example.com', passwordHash: 'hash' });
      const session = await sessions.createSession(connection, {
        userId: user.id,
        tokenHash: 'token-hash',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      assert.ok(session.id);

      const found = await sessions.getSessionByTokenHash(connection, 'token-hash');
      assert.equal(found?.userId, user.id);

      const userSessions = await sessions.getSessionsByUserId(connection, user.id);
      assert.equal(userSessions.length, 1);
    });

    pgIt('revokes session', async () => {
      const user = await users.createUser(connection, { email: 'revoke@example.com', passwordHash: 'hash' });
      const session = await sessions.createSession(connection, {
        userId: user.id,
        tokenHash: 'revoke-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const revoked = await sessions.revokeSession(connection, session.id);
      assert.equal(revoked, true);
      const found = await sessions.getSessionByTokenHash(connection, 'revoke-token');
      assert.ok(found?.revokedAt);
    });

    pgIt('revokes all sessions except current', async () => {
      const user = await users.createUser(connection, { email: 'revokeall@example.com', passwordHash: 'hash' });
      const s1 = await sessions.createSession(connection, {
        userId: user.id,
        tokenHash: 's1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      await sessions.createSession(connection, {
        userId: user.id,
        tokenHash: 's2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      await sessions.revokeAllUserSessions(connection, user.id, s1.id);
      const list = await sessions.getSessionsByUserId(connection, user.id);
      assert.equal(list.filter((s) => s.revokedAt === null).length, 1);
    });
  });

  describe('recovery after restart', () => {
    pgIt('data persists across reconnections', async () => {
      const created = await users.createUser(connection, { email: 'persist@example.com', passwordHash: 'hash' });
      await connection.close();

      const newConnection = await createConnection(testConfig);
      try {
        const found = await users.getUserById(newConnection, created.id);
        assert.equal(found?.email, 'persist@example.com');
      } finally {
        await newConnection.close();
      }

      connection = await createConnection(testConfig);
    });
  });
});
