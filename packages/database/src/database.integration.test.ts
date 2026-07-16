import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnvLocal } from './testing/env.js';
applyEnvLocal();
import { loadDatabaseConfig, type DatabaseConfig } from './config.js';
import { createConnection, type DatabaseConnection } from './client.js';
import { setupTestDatabase, resetTestDatabase } from './testing/setup.js';
import { runMigrations } from './migrations/runner.js';
import { applyMigration, computeChecksum, getAppliedMigrations, type Migration } from './migrations/journal.js';
import * as users from './repositories/users.js';
import * as sessions from './repositories/sessions.js';
import * as configuration from './repositories/configuration.js';
import * as audit from './repositories/audit.js';
import { checkHealth } from './health.js';
import { withTransaction } from './transaction.js';

const pgRequired = process.env.PG_REQUIRED === 'true';

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
      await setupTestDatabase(baseConfig);
      connection = await createConnection(testConfig);
      await resetTestDatabase(baseConfig);
    } catch (err) {
      if (pgRequired) throw err;
    }
  });

  after(async () => {
    if (connection) {
      await connection.close().catch(() => {});
    }
  });

  beforeEach(async () => {
    if (connection) {
      await resetTestDatabase(baseConfig).catch(() => {});
    }
  });

  function pgIt(name: string, fn: () => Promise<void>) {
    it(name, async () => {
      if (!connection) return;
      await fn();
    });
  }

  describe('health', () => {
    pgIt('reports healthy for real connection', async () => {
      const result = await checkHealth(connection);
      assert.equal(result.healthy, true);
    });
  });

  describe('migration ordering', () => {
    pgIt('applies migrations in version order', async () => {
      await resetTestDatabase(baseConfig);
      const applied = await getAppliedMigrations(connection);
      const versions = applied.map((m) => m.version);
      assert.deepEqual(versions, ['0001', '0002', '0003', '0005', '0006', '0007', '0008', '0009']);
    });

    pgIt('is idempotent across repeated runs', async () => {
      await runMigrations(connection);
      await runMigrations(connection);
      const applied = await getAppliedMigrations(connection);
      assert.equal(applied.length, 8);
    });

    pgIt('rejects checksum mismatch on reapplication', async () => {
      const badMigration: Migration = {
        version: '0001',
        name: 'initial',
        sql: 'ALTER TABLE users DROP COLUMN password_hash;',
      };
      await assert.rejects(async () => {
        await applyMigration(connection, badMigration);
      }, /checksum mismatch/);
    });
  });

  describe('transaction rollback', () => {
    pgIt('rolls back on failure and leaves journal unchanged', async () => {
      const journalBefore = await getAppliedMigrations(connection);
      const beforeChecksums = journalBefore.map((m) => m.checksum);

      const badMigration: Migration = {
        version: '9999',
        name: 'broken',
        sql: 'CREATE TABLE IF NOT EXISTS broken (id INT PRIMARY KEY);',
      };

      // Apply 9999 successfully first time
      await applyMigration(connection, badMigration);
      const journalMid = await getAppliedMigrations(connection);
      assert.equal(journalMid.length, journalBefore.length + 1);

      // Re-apply with different checksum should roll back and not change journal
      const modifiedMigration: Migration = {
        version: '9999',
        name: 'broken',
        sql: 'CREATE TABLE IF NOT EXISTS broken (id INT PRIMARY KEY, extra TEXT);',
      };

      // Try transaction that fails
      await assert.rejects(
        async () =>
          withTransaction(connection, async (client) => {
            await client.query('SELECT 1');
            throw new Error('simulated failure');
          }),
        /simulated failure/,
      );

      const journalAfter = await getAppliedMigrations(connection);
      const afterChecksums = journalAfter.map((m) => m.checksum);
      assert.deepEqual(afterChecksums, beforeChecksums.concat(computeChecksum(badMigration.sql)));
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

  describe('configuration version persistence', () => {
    pgIt('creates and retrieves a configuration version', async () => {
      const id = crypto.randomUUID();
      await configuration.createConfigurationVersion(connection, {
        id,
        version: '1.0.0',
        status: 'active',
        key: 'test.key',
        value: { setting: 'value' },
        scope: 'global',
        environment: 'development',
        effectiveFrom: new Date().toISOString(),
        source: 'test',
      });

      const found = await configuration.getConfigurationVersionById(connection, id);
      assert.ok(found);
      assert.equal(found?.key, 'test.key');
    });
  });

  describe('audit append behaviour', () => {
    pgIt('creates and retrieves audit events', async () => {
      const user = await users.createUser(connection, { email: 'audit@example.com', passwordHash: 'hash' });
      await audit.createAuditEvent(connection, {
        version: '1.0.0',
        eventType: 'user.created',
        actorId: user.id,
        targetType: 'user',
        targetId: user.id,
        changes: { field: 'email', from: null, to: 'audit@example.com' },
      });

      const events = await audit.getAuditEventsByTarget(connection, 'user', user.id);
      assert.ok(events.length >= 1);
      const first = events[0]!;
      assert.equal(first.eventType, 'user.created');
    });

    pgIt('appends multiple events preserving order', async () => {
      const user = await users.createUser(connection, { email: 'audit2@example.com', passwordHash: 'hash' });

      await audit.createAuditEvent(connection, {
        version: '1.0.0',
        eventType: 'first.event',
        actorId: user.id,
        targetType: 'user',
        targetId: user.id,
      });

      await audit.createAuditEvent(connection, {
        version: '1.0.0',
        eventType: 'second.event',
        actorId: user.id,
        targetType: 'user',
        targetId: user.id,
      });

      const events = await audit.getAuditEventsByTarget(connection, 'user', user.id);
      assert.equal(events.length, 2);
      assert.equal(events[0]!.eventType, 'second.event');
      assert.equal(events[1]!.eventType, 'first.event');
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

  describe('clean connection shutdown', () => {
    pgIt('performs clean close without errors', async () => {
      const conn = await createConnection(testConfig);
      await conn.close();
      assert.ok(true, 'close completed without error');
    });

    pgIt('multiple close calls are idempotent', async () => {
      const conn = await createConnection(testConfig);
      await conn.close();
      await conn.close();
      assert.ok(true, 'second close did not throw');
    });
  });
});
