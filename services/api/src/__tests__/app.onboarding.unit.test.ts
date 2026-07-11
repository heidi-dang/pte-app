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

function makeRepos(overrides = {}) {
  return {
    sessions: { findActiveSession: mock.fn(async () => activeSession) },
    users: {
      setTargets: mock.fn(async () => ({})),
      recordMicrophoneCheck: mock.fn(async () => ({})),
      updateOnboardingStep: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /app/onboarding/targets', () => {
  it('returns 200 on valid score set', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'POST',
      url: '/app/onboarding/targets',
      headers: { authorization: 'Bearer validToken' },
      payload: { targetOverallScore: 79, targetSpeaking: 79, examDate: '2027-03-01' },
    });

    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /updated/);
    await app.close();
  });

  it('returns 400 when score is out of PTE range', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'POST',
      url: '/app/onboarding/targets',
      headers: { authorization: 'Bearer validToken' },
      payload: { targetOverallScore: 95 }, // invalid: max is 90
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /10 and 90/);
    await app.close();
  });

  it('returns 400 for invalid examDate', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'POST',
      url: '/app/onboarding/targets',
      headers: { authorization: 'Bearer validToken' },
      payload: { examDate: 'not-a-date' },
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /ISO 8601/);
    await app.close();
  });
});

describe('POST /app/onboarding/microphone-check', () => {
  it('returns 200 on success', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'POST',
      url: '/app/onboarding/microphone-check',
      headers: { authorization: 'Bearer validToken' },
    });

    assert.equal(res.statusCode, 200);
    assert.match(res.json().message, /recorded/);
    await app.close();
  });

  it('returns 401 without authorization', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({ method: 'POST', url: '/app/onboarding/microphone-check' });
    assert.equal(res.statusCode, 401);
    await app.close();
  });
});

describe('PATCH /app/onboarding/step', () => {
  it('returns 200 with valid step', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/onboarding/step',
      headers: { authorization: 'Bearer validToken' },
      payload: { step: 'profile' },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().step, 'profile');
    assert.equal(res.json().complete, false);
    await app.close();
  });

  it('returns 200 with complete=true when step is "complete"', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/onboarding/step',
      headers: { authorization: 'Bearer validToken' },
      payload: { step: 'complete' },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().complete, true);
    await app.close();
  });

  it('returns 400 for invalid step name', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/onboarding/step',
      headers: { authorization: 'Bearer validToken' },
      payload: { step: 'hacking' },
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /Invalid step/);
    await app.close();
  });

  it('returns 400 when step field is missing', async () => {
    const app = await buildApp(loadConfig());
    (app as any).repositories = makeRepos();
    (app as any).db = { session: { update: mock.fn(async () => ({})) } };

    const res = await app.inject({
      method: 'PATCH',
      url: '/app/onboarding/step',
      headers: { authorization: 'Bearer validToken' },
      payload: {},
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /step/);
    await app.close();
  });
});
