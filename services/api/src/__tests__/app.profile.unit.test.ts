import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

const activeSession = {
  id: 's1',
  user: {
    id: 'u1',
    email: 'test@example.com',
    emailVerified: true,
    roles: [{ role: { name: 'FREE_STUDENT' } }],
  },
};

describe('PATCH /app/profile', () => {
  it('returns 200 and updated profile on valid request', async () => {
    const app = await buildApp(loadConfig());
    const mockProfile = { firstName: 'Updated', lastName: 'Name', country: 'AU', timezone: 'Australia/Sydney' };

    (app as any).repositories = {
      sessions: { findActiveSession: mock.fn(async () => activeSession) },
      users: {
        findById: mock.fn(async () => ({
          ...activeSession.user,
          profile: { firstName: 'Old', lastName: 'Name' },
        })),
        upsertProfile: mock.fn(async () => mockProfile),
      },
    };
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/profile',
      headers: { authorization: 'Bearer validToken' },
      payload: { firstName: 'Updated', country: 'AU', timezone: 'Australia/Sydney' },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.json().profile);
    assert.equal(res.json().profile.country, 'AU');
    await app.close();
  });

  it('returns 400 when studyHistoryMonths is negative', async () => {
    const app = await buildApp(loadConfig());

    (app as any).repositories = {
      sessions: { findActiveSession: mock.fn(async () => activeSession) },
      users: {
        findById: mock.fn(async () => ({ ...activeSession.user, profile: {} })),
      },
    };
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/profile',
      headers: { authorization: 'Bearer validToken' },
      payload: { studyHistoryMonths: -1 },
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /non-negative/);
    await app.close();
  });

  it('returns 401 without authorization header', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({ method: 'PATCH', url: '/app/profile', payload: { firstName: 'X' } });
    assert.equal(res.statusCode, 401);
    await app.close();
  });
});
