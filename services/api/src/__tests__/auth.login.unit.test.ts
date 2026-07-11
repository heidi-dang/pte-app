import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeMockRepos(overrides = {}) {
  return {
    users: {
      findByEmail: mock.fn(async () => null),
      isLockedOut: mock.fn(async () => false),
      recordFailedLogin: mock.fn(async () => ({})),
      resetFailedLogins: mock.fn(async () => ({})),
    },
    sessions: {
      createSession: mock.fn(async () => ({})),
    },
    audit: {
      append: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /auth/login', () => {
  it('returns 200 and token on successful credentials', async () => {
    const app = await buildApp(loadConfig());
    const passHash = await bcrypt.hash('validPassword', 10);
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => ({
          id: 'u1',
          email: 'test@example.com',
          passwordHash: passHash,
        })),
        isLockedOut: mock.fn(async () => false),
        resetFailedLogins: mock.fn(async () => ({})),
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'validPassword',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.json().token);
    assert.ok(res.json().expiresAt);

    assert.equal((mockRepos.users.resetFailedLogins as any).mock.calls.length, 1);
    assert.equal((mockRepos.sessions.createSession as any).mock.calls.length, 1);
    await app.close();
  });

  it('returns 401 for incorrect credentials', async () => {
    const app = await buildApp(loadConfig());
    const passHash = await bcrypt.hash('validPassword', 10);
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => ({
          id: 'u1',
          email: 'test@example.com',
          passwordHash: passHash,
        })),
        isLockedOut: mock.fn(async () => false),
        recordFailedLogin: mock.fn(async () => ({})),
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'wrongPassword',
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal((mockRepos.users.recordFailedLogin as any).mock.calls.length, 1);
    await app.close();
  });

  it('returns 423 if account is locked out', async () => {
    const app = await buildApp(loadConfig());
    const passHash = await bcrypt.hash('validPassword', 10);
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => ({
          id: 'u1',
          email: 'test@example.com',
          passwordHash: passHash,
        })),
        isLockedOut: mock.fn(async () => true), // Locked out
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'validPassword',
      },
    });

    assert.equal(res.statusCode, 423);
    assert.match(res.json().message, /temporarily locked/);
    await app.close();
  });
});
