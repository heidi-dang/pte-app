import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeMockRepos(overrides = {}) {
  return {
    users: {
      findActiveVerification: mock.fn(async () => null),
      consumeVerification: mock.fn(async () => ({})),
    },
    sessions: {
      invalidateAllUserSessions: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /auth/reset-password', () => {
  it('returns 200 on valid token and resets password', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findActiveVerification: mock.fn(async () => ({
          id: 'v2',
          userId: 'u1',
          token: 'tokReset',
        })),
        consumeVerification: mock.fn(async () => ({})),
      },
      sessions: {
        invalidateAllUserSessions: mock.fn(async () => ({})),
      },
    });

    (app as any).repositories = mockRepos;
    (app as any).db = {
      $transaction: mock.fn(async (cb: any) => {
        return cb(app.db);
      }),
      user: {
        update: mock.fn(async () => ({})),
      },
      emailVerification: {
        update: mock.fn(async () => ({})),
      },
      session: {
        updateMany: mock.fn(async () => ({})),
      },
    };

    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: 'tokReset',
        newPassword: 'brandNewPassword123',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /successfully/);

    // Verify password update, token consumption, and session invalidation were triggered
    assert.equal((app.db.user.update as any).mock.calls.length, 1);
    assert.equal((app.db.emailVerification.update as any).mock.calls.length, 1);
    assert.equal((app.db.session.updateMany as any).mock.calls.length, 1);
    await app.close();
  });

  it('returns 400 if token or password parameter is missing', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: 'tokReset',
      },
    });

    assert.equal(res.statusCode, 400);
    await app.close();
  });

  it('returns 400 if password is less than 8 characters', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: 'tokReset',
        newPassword: 'short',
      },
    });

    assert.equal(res.statusCode, 400);
    await app.close();
  });

  it('returns 400 on expired or invalid reset token', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findActiveVerification: mock.fn(async () => null), // Token not found or expired
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: 'tokInvalid',
        newPassword: 'brandNewPassword123',
      },
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /Invalid or expired/);
    await app.close();
  });
});
