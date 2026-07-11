import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

function makeMockRepos(overrides = {}) {
  return {
    users: {
      findByEmail: mock.fn(async () => null),
      createEmailVerification: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /auth/forgot-password', () => {
  it('returns 200 and dispatches email if user exists', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => ({
          id: 'u1',
          email: 'user@example.com',
        })),
        createEmailVerification: mock.fn(async () => ({})),
      },
    });
    const mockSend = mock.fn(async () => {});

    (app as any).repositories = mockRepos;
    (app as any).emailProvider = { send: mockSend };

    const res = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: {
        email: 'user@example.com',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal((mockRepos.users.findByEmail as any).mock.calls.length, 1);
    assert.equal((mockRepos.users.createEmailVerification as any).mock.calls.length, 1);
    const calls = mockSend.mock.calls as any;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].arguments[0].to, 'user@example.com');
    await app.close();
  });

  it('returns 200 without email dispatch if user does not exist', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => null),
      },
    });
    const mockSend = mock.fn(async () => {});

    (app as any).repositories = mockRepos;
    (app as any).emailProvider = { send: mockSend };

    const res = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: {
        email: 'nonexistent@example.com',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(mockSend.mock.calls.length, 0); // No email sent
    await app.close();
  });

  it('returns 400 if email is missing', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: {},
    });

    assert.equal(res.statusCode, 400);
    await app.close();
  });
});
