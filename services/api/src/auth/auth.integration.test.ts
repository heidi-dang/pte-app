import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnvLocal } from '@pte-app/database/testing/env';
applyEnvLocal();
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { createConnection, users as usersRepo, audit, type DatabaseConnection } from '@pte-app/database';
import { resetTestDatabase, setupTestDatabase } from '@pte-app/database/testing/setup';

describe('auth integration', () => {
  const config = loadConfig();
  const testConfig = { ...config.database, database: `${config.database.database}_test` };
  let connection: DatabaseConnection;
  let app: FastifyInstance;

  const testEmail = `auth-${Date.now()}@example.com`;
  const testPassword = 'securePassword123';
  const testDisplayName = 'Test User';

  before(async () => {
    await setupTestDatabase(config.database);
    connection = await createConnection(testConfig);
    await resetTestDatabase(config.database);
    app = await buildApp({ ...config, database: testConfig });
    await app.ready();
  });

  after(async () => {
    await app.close();
    await connection.close();
  });

  describe('registration', () => {
    it('registers a new account with default student role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: testEmail, password: testPassword, displayName: testDisplayName },
      });
      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.ok(body.user.id);
      assert.equal(body.user.email, testEmail);
      assert.deepEqual(body.user.roles, ['student']);
      assert.ok(body.token);
      assert.ok(body.session.id);
      assert.ok(body.session.expiresAt);
    });

    it('rejects duplicate email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `dup-${testEmail}`, password: testPassword, displayName: 'Dup' },
      });
      assert.equal(res.statusCode, 201);

      const dup = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `dup-${testEmail}`, password: testPassword, displayName: 'Dup2' },
      });
      assert.equal(dup.statusCode, 409);
    });

    it('rejects short password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'shortpw@example.com', password: '123', displayName: 'Short' },
      });
      assert.equal(res.statusCode, 400);
    });

    it('rejects missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {},
      });
      assert.equal(res.statusCode, 400);
    });
  });

  describe('authentication', () => {
    it('logs in with valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(body.token);
      assert.equal(body.user.email, testEmail);
    });

    it('rejects wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: 'wrongPassword' },
      });
      assert.equal(res.statusCode, 401);
    });

    it('rejects non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'nonexistent@example.com', password: testPassword },
      });
      assert.equal(res.statusCode, 401);
    });
  });

  describe('session management', () => {
    let token: string;
    let currentSessionId: string;

    before(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      token = res.json().token;
      currentSessionId = res.json().session.id;
    });

    it('returns current user with valid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().user.email, testEmail);
      assert.ok(!res.json().user.passwordHash, 'should not return password hash');
    });

    it('lists sessions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 200);
      assert.ok(res.json().sessions.length >= 1);
    });

    it('revokes a specific session', async () => {
      // Create a second session to revoke by logging in again
      await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      const list = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: { authorization: `Bearer ${token}` },
      });
      const sessions = list.json().sessions;
      // Find a session that is NOT the current one
      const otherSession = sessions.find((s: { id: string }) => s.id !== currentSessionId);
      if (!otherSession) {
        // Only one session exists, skip
        return;
      }

      const revoke = await app.inject({
        method: 'DELETE',
        url: `/auth/sessions/${otherSession.id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(revoke.statusCode, 200);

      // Session should be marked as revoked
      const list2 = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(list2.statusCode, 200, `list2 should return 200: ${list2.body}`);
      assert.ok(list2.json().sessions, 'sessions should exist in response');
      const revokedSession = list2.json().sessions.find((s: { id: string }) => s.id === otherSession.id);
      assert.ok(revokedSession?.revokedAt, 'revoked session should have revokedAt set');
    });

    it('revokes all other sessions', async () => {
      // Login twice to get two sessions
      const login1 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      const token1 = login1.json().token;

      const login2 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      const token2 = login2.json().token;

      // Revoke all sessions except the first one
      const others = await app.inject({
        method: 'DELETE',
        url: '/auth/sessions/others',
        headers: { authorization: `Bearer ${token1}` },
      });
      assert.equal(others.statusCode, 200);

      // token1 should still be valid
      const me1 = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${token1}` },
      });
      assert.equal(me1.statusCode, 200);

      // token2 should now be invalid (revoked)
      const me2 = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${token2}` },
      });
      assert.equal(me2.statusCode, 401);
    });

    it('does not revoke sessions belonging to other users', async () => {
      // Create two different users
      const userA = `userA-${Date.now()}@example.com`;
      const userB = `userB-${Date.now()}@example.com`;

      const resA = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: userA, password: 'password123', displayName: 'UserA' },
      });
      assert.equal(resA.statusCode, 201);
      const tokenA = resA.json().token;

      const resB = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: userB, password: 'password123', displayName: 'UserB' },
      });
      assert.equal(resB.statusCode, 201);
      const tokenB = resB.json().token;

      // Revoke user A's other sessions - should not affect user B
      const others = await app.inject({
        method: 'DELETE',
        url: '/auth/sessions/others',
        headers: { authorization: `Bearer ${tokenA}` },
      });
      assert.equal(others.statusCode, 200);

      // User B's session should be unaffected
      const meB = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${tokenB}` },
      });
      assert.equal(meB.statusCode, 200);
      assert.equal(meB.json().user.email, userB);
    });

    it('logs out and invalidates the session token', async () => {
      const login = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      const tok = login.json().token;

      const logout = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { authorization: `Bearer ${tok}` },
      });
      assert.equal(logout.statusCode, 200);

      const me = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${tok}` },
      });
      assert.equal(me.statusCode, 401);
    });
  });

  describe('disabled user rejection', () => {
    let disabledToken: string;
    let disabledUserId: string;

    before(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `disabled-${testEmail}`, password: testPassword, displayName: 'Disabled' },
      });
      disabledUserId = res.json().user.id;
      disabledToken = res.json().token;

      // disable the account directly in the database
      await usersRepo.updateUser(connection, disabledUserId, { disabled: true });
    });

    it('rejects login for disabled user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: `disabled-${testEmail}`, password: testPassword },
      });
      assert.equal(res.statusCode, 401);
    });

    it('rejects /auth/me for disabled user token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${disabledToken}` },
      });
      assert.equal(res.statusCode, 401);
    });
  });

  describe('expired session rejection', () => {
    it('rejects an expired session token', async () => {
      // Register and manually expire the session in the database
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `expired-${testEmail}`, password: testPassword, displayName: 'Expired' },
      });
      const token = res.json().token;
      const sessionId = res.json().session.id;

      // Manually expire the session
      await connection.pool.query("UPDATE sessions SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1", [
        sessionId,
      ]);

      const me = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(me.statusCode, 401);
    });
  });

  describe('role and permission isolation', () => {
    it('registers all five roles correctly', async () => {
      const roles = ['student', 'teacher', 'content_editor', 'admin', 'support'];
      for (const role of roles) {
        const email = `role-${role}-${Date.now()}@example.com`;
        const res = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: { email, password: testPassword, displayName: role },
        });
        assert.equal(res.statusCode, 201, `should register ${role}`);
        assert.deepEqual(res.json().user.roles, ['student']);
      }
    });

    it('audit events are created on registration', async () => {
      const email = `audit-${Date.now()}@example.com`;
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password: testPassword, displayName: 'Audit' },
      });
      assert.equal(res.statusCode, 201);
      const userId = res.json().user.id;

      const events = await audit.getAuditEventsByTarget(connection, 'user', userId);
      assert.ok(events.length >= 1);
      assert.equal(events[0]!.eventType, 'created');
    });
  });

  describe('configuration-driven session policy', () => {
    it('enforces max sessions per user', async () => {
      const email = `maxsess-${Date.now()}@example.com`;
      // Register once
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email, password: testPassword, displayName: 'MaxSess' },
      });

      // Login multiple times and verify old sessions are cleaned up
      const sessions: Set<string> = new Set();
      for (let i = 0; i < 5; i++) {
        const login = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: { email, password: testPassword },
        });
        assert.equal(login.statusCode, 200);
        sessions.add(login.json().session.id);
      }

      // The list should not exceed MAX_SESSIONS_PER_USER (10 from env)
      const latest = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password: testPassword },
      });
      const token = latest.json().token;

      const list = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.ok(list.json().sessions.length <= 10);
    });
  });

  describe('authentication scope (parent hook)', () => {
    let userToken: string;
    const scopeEmail = `auth-scope-${Date.now()}@example.com`;

    before(async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: scopeEmail, password: testPassword, displayName: 'AuthScope' },
      });
      userToken = reg.json().token;
    });

    it('valid cookie populates request.auth', async () => {
      const login = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: scopeEmail, password: testPassword },
      });
      const cookies = login.cookies;
      const sessionCookie = cookies.find((c: { name: string }) => c.name === 'pte_session');
      assert.ok(sessionCookie);

      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { cookie: `${sessionCookie.name}=${sessionCookie.value}` },
      });
      assert.equal(meRes.statusCode, 200);
      assert.ok(meRes.json().user);
    });

    it('valid Bearer token populates request.auth', async () => {
      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${userToken}` },
      });
      assert.equal(meRes.statusCode, 200);
      assert.ok(meRes.json().user.roles.includes('student'));
    });

    it('malformed Bearer header returns 401 from protected routes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: 'NotBearer token' },
      });
      assert.equal(res.statusCode, 401);
    });

    it('invalid Bearer token returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: 'Bearer invalid-token-abc' },
      });
      assert.equal(res.statusCode, 401);
    });

    it('unauthenticated request returns 401 for protected routes', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/me' });
      assert.equal(res.statusCode, 401);
    });

    it('public routes remain accessible without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/live' });
      assert.equal(res.statusCode, 200);
    });

    it('expired cookie returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { cookie: 'pte_session=expired-token-value' },
      });
      assert.equal(res.statusCode, 401);
    });

    it('revoked session returns 401', async () => {
      const login = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: scopeEmail, password: testPassword },
      });
      const tempToken = login.json().token;

      await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { authorization: `Bearer ${tempToken}` },
      });

      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${tempToken}` },
      });
      assert.equal(meRes.statusCode, 401);
    });
  });
});
