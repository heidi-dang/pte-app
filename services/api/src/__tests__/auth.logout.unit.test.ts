import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeMockRepos(overrides = {}) {
  return {
    sessions: {
      findActiveSession: mock.fn(async () => ({
        id: 's1',
        user: {
          id: 'u1',
          email: 'test@example.com',
          emailVerified: false,
          roles: [{ role: { name: 'FREE_STUDENT' } }],
        },
      })),
      invalidateSession: mock.fn(async () => ({})),
    },
    audit: {
      append: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /auth/logout', () => {
  it('returns 200 and invalidates session when authorized', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos();

    (app as any).repositories = mockRepos;
    (app as any).db = {
      session: {
        update: mock.fn(async () => ({})),
      },
    };

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: 'Bearer validToken123',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal((mockRepos.sessions.invalidateSession as any).mock.calls.length, 1);
    assert.equal((mockRepos.sessions.invalidateSession as any).mock.calls[0].arguments[0], 'validToken123');
    await app.close();
  });

  it('returns 401 when authorization header is missing', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });

    assert.equal(res.statusCode, 401);
    await app.close();
  });
});
