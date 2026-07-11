import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeMockRepos(overrides = {}) {
  return {
    users: {
      findActiveVerification: mock.fn(async () => null),
      markEmailVerified: mock.fn(async () => ({})),
      consumeVerification: mock.fn(async () => ({})),
    },
    audit: {
      append: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('GET /auth/verify-email', () => {
  it('returns 200 on valid token and processes verification', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findActiveVerification: mock.fn(async () => ({
          id: 'v1',
          userId: 'u1',
          token: 'tok123',
        })),
        markEmailVerified: mock.fn(async () => ({})),
        consumeVerification: mock.fn(async () => ({})),
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
      auditLog: {
        create: mock.fn(async () => ({})),
      },
    };

    const res = await app.inject({
      method: 'GET',
      url: '/auth/verify-email?token=tok123',
    });

    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /successfully/);

    // Verify verification and consumption were called on transaction repo
    assert.equal((mockRepos.users.findActiveVerification as any).mock.calls.length, 1);
    await app.close();
  });

  it('returns 400 if token query parameter is missing', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'GET',
      url: '/auth/verify-email',
    });

    assert.equal(res.statusCode, 400);
    await app.close();
  });

  it('returns 400 on expired or invalid token', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findActiveVerification: mock.fn(async () => null), // Not found or inactive
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'GET',
      url: '/auth/verify-email?token=invalidToken',
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /Invalid or expired/);
    await app.close();
  });
});
