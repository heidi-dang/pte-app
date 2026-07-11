import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeAuthenticatedApp(userOverrides = {}) {
  const defaultUser = {
    id: 'u1',
    email: 'test@example.com',
    emailVerified: true,
    roles: [{ role: { name: 'FREE_STUDENT' } }],
    ...userOverrides,
  };
  return { defaultUser };
}

describe('GET /app/me', () => {
  it('returns 200 with user data for authenticated user', async () => {
    const app = await buildApp(loadConfig());
    const { defaultUser } = makeAuthenticatedApp();
    const fullUser = {
      ...defaultUser,
      profile: { firstName: 'Jane', lastName: 'Doe', displayName: null },
      createdAt: new Date(),
    };

    (app as any).repositories = {
      sessions: {
        findActiveSession: mock.fn(async () => ({
          id: 's1',
          user: defaultUser,
        })),
      },
      users: {
        findById: mock.fn(async () => fullUser),
      },
    };
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'GET',
      url: '/app/me',
      headers: { authorization: 'Bearer validToken' },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().id, 'u1');
    assert.equal(res.json().email, 'test@example.com');
    assert.ok(res.json().profile);
    assert.deepEqual(res.json().roles, ['FREE_STUDENT']);
    await app.close();
  });

  it('returns 401 with no auth header', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({ method: 'GET', url: '/app/me' });
    assert.equal(res.statusCode, 401);
    await app.close();
  });

  it('returns 404 when authenticated user is not found in DB', async () => {
    const app = await buildApp(loadConfig());
    const { defaultUser } = makeAuthenticatedApp();

    (app as any).repositories = {
      sessions: {
        findActiveSession: mock.fn(async () => ({ id: 's1', user: defaultUser })),
      },
      users: { findById: mock.fn(async () => null) },
    };
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'GET',
      url: '/app/me',
      headers: { authorization: 'Bearer validToken' },
    });
    assert.equal(res.statusCode, 404);
    await app.close();
  });
});
