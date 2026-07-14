import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnvLocal } from '@pte-app/database/testing/env';
applyEnvLocal();
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { createConnection, type DatabaseConnection } from '@pte-app/database';
import { resetTestDatabase, setupTestDatabase } from '@pte-app/database/testing/setup';

describe('auth integration', () => {
  const config = loadConfig();
  const testConfig = { ...config.database, database: `${config.database.database}_test` };
  let connection: DatabaseConnection;
  let app: FastifyInstance;

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

  it('registers a new account', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'student@example.com', password: 'password123', displayName: 'Student' },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.ok(body.user.id);
    assert.equal(body.user.email, 'student@example.com');
    assert.ok(body.token);
  });

  it('rejects duplicate registration', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@example.com', password: 'password123', displayName: 'Dup' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@example.com', password: 'password123', displayName: 'Dup' },
    });
    assert.equal(res.statusCode, 409);
  });

  it('logs in with valid credentials', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'login@example.com', password: 'password123', displayName: 'Login' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login@example.com', password: 'password123' },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.token);
  });

  it('rejects invalid login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    });
    assert.equal(res.statusCode, 401);
  });

  it('returns current user with valid token', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'me@example.com', password: 'password123', displayName: 'Me' },
    });
    const token = register.json().token;
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().user.email, 'me@example.com');
  });

  it('logs out and invalidates token', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'logout@example.com', password: 'password123', displayName: 'Logout' },
    });
    const token = register.json().token;
    const logout = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(logout.statusCode, 200);

    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(me.statusCode, 401);
  });

  it('lists and revokes sessions', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'sessions@example.com', password: 'password123', displayName: 'Sessions' },
    });
    const token = register.json().token;

    const list = await app.inject({
      method: 'GET',
      url: '/auth/sessions',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(list.statusCode, 200);
    const sessionId = list.json().sessions[0].id;

    const revoke = await app.inject({
      method: 'DELETE',
      url: `/auth/sessions/${sessionId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(revoke.statusCode, 200);
  });

  it('enforces password length', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'short@example.com', password: '123', displayName: 'Short' },
    });
    assert.equal(res.statusCode, 400);
  });
});
