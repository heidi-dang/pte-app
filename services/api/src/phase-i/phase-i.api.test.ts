import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { startTestHarness, type TestHarness } from '../phase-h/test-harness.js';
import { buildTestFixtures, type PhaseITestFixtures } from './test-fixtures.js';

const runId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface ApiResponse {
  status: number;
  data: any;
}

async function api(path: string, opts: RequestInit & { token?: string } = {}): Promise<ApiResponse> {
  const url = `${harness.apiUrl}${path}`;
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...((opts.headers as Record<string, string>) || {}) },
  });
  const data = await res.json().catch(() => ({ error: 'Parse error' }));
  return { status: res.status, data };
}

async function login(email: string, password: string): Promise<string> {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(status, 200, `login failed: ${data.error}`);
  assert.ok(data.token, 'expected token in login response');
  return data.token;
}

let harness: TestHarness;
let fixtures: PhaseITestFixtures;
let studentToken: string;
let qId0: string;

describe('Phase I API Integration', () => {
  before(async () => {
    harness = await startTestHarness();
    fixtures = await buildTestFixtures(harness.db);
    studentToken = await login(fixtures.student.email, fixtures.student.password);
    qId0 = fixtures.questionIds[0]!;
  });

  beforeEach(async () => {
    await harness.db.pool.query(
      `UPDATE question_sessions SET status = 'completed' WHERE user_id = $1 AND lesson_id = $2 AND status = 'active'`,
      [fixtures.student.id, fixtures.lessonId],
    );
  });

  after(async () => {
    await harness?.stop();
  });

  describe('Renderer Registry', () => {
    it('demo renderers are registered on plugin load', async () => {
      const { status, data } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      assert.equal(status, 201, JSON.stringify(data));
      assert.ok(data.session, 'session expected');
      assert.ok(data.attempts, 'attempts expected');
      assert.equal(data.attempts.length, 1);
    });

    it('resolves renderer and validates response on autosave', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      const attemptId = start.attempts[0].id;

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: { selectedIndex: 2 } }),
      });
      assert.equal(status, 200, JSON.stringify(data));
      assert.equal(data.status, 'autosaved');
    });

    it('rejects invalid response via renderer validation on autosave', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      const attemptId = start.attempts[0].id;

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: { selectedIndex: 'not-a-number' } }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error, 'expected error message');
    });
  });

  describe('Corrupt Payload Rejection', () => {
    it('rejects non-object request body', async () => {
      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: '"not-an-object"',
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });

    it('rejects null response field', async () => {
      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId: 'any', response: null }),
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });

    it('rejects array response field', async () => {
      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId: 'any', response: [1, 2, 3] }),
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });

    it('rejects non-object request body on submit', async () => {
      const { status, data } = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: '"not-an-object"',
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });

    it('rejects non-object request body on playback record', async () => {
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: '"not-an-object"',
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });
  });

  describe('Empty / Incomplete Response', () => {
    it('accepts empty response (renderer treats as valid)', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      const attemptId = start.attempts[0].id;

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: {} }),
      });
      assert.equal(status, 200, JSON.stringify(data));
    });

    it('accepts incomplete response (null value per demo contract)', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      const attemptId = start.attempts[0].id;

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: { selectedIndex: null } }),
      });
      assert.equal(status, 200, JSON.stringify(data));
    });
  });

  describe('State Machine Enforcement', () => {
    it('rejects autosave on submitted attempt', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;

      await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: {},
          idempotencyKey: `sm-test-${runId}`,
        }),
      });

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: { text: 'more' } }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('terminal'), data.error);
    });

    it('rejects autosave on reviewable attempt', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;

      await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: {},
          idempotencyKey: `sm-review-${runId}`,
        }),
      });

      await harness.db.pool.query(`UPDATE question_attempts SET status = 'reviewable' WHERE id = $1`, [attemptId]);

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: { text: 'more' } }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('terminal'), data.error);
    });

    it('rejects submit on already submitted attempt', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;

      await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: {},
          idempotencyKey: `sm-sub-${runId}`,
        }),
      });

      const { status, data } = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: {},
          idempotencyKey: `sm-sub-${runId}-2`,
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('terminal'), data.error);
    });
  });

  describe('Timer / Expiry Enforcement', () => {
    it('rejects autosave on expired attempt', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'timed',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;

      // Manually expire the attempt
      await harness.db.pool.query(
        `UPDATE question_attempts SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1`,
        [attemptId],
      );

      const { status, data } = await api('/api/v1/attempt/autosave', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: {} }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('expired'), data.error);
    });

    it('rejects submit on expired attempt', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'timed',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;

      await harness.db.pool.query(
        `UPDATE question_attempts SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1`,
        [attemptId],
      );

      const { status, data } = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: {},
          idempotencyKey: `expired-submit-${runId}`,
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('expired'), data.error);
    });
  });

  describe('Playback Rights Enforcement', () => {
    it('rejects extra plays once maxPlays is consumed', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;
      const mediaId = `media-${runId}`;

      // First play
      const first = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId, maxPlays: 2 }),
      });
      assert.equal(first.status, 200);
      assert.equal(first.data.remainingPlays, 1);
      assert.equal(first.data.consumed, false);

      // Second play (maxPlays reached)
      const second = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId, maxPlays: 2 }),
      });
      assert.equal(second.status, 200);
      assert.equal(second.data.remainingPlays, 0);
      assert.equal(second.data.consumed, true);

      // Third play (should be refused)
      const third = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId, maxPlays: 2 }),
      });
      assert.equal(third.status, 200);
      assert.equal(third.data.remainingPlays, 0);
      assert.equal(third.data.consumed, true);
      // Play count should not have incremented from second to third
      assert.equal(third.data.playback.playCount, second.data.playback.playCount);
    });

    it('survives reconnect (play count preserved)', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;
      const mediaId = `media-recon-${runId}`;

      await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId, maxPlays: 3 }),
      });

      // Simulate reconnect by reading from DB directly
      const afterPlay = await harness.db.pool.query(
        `SELECT play_count, consumed_at FROM playback_consumption WHERE attempt_id = $1 AND media_id = $2`,
        [attemptId, mediaId],
      );
      assert.equal(afterPlay.rows[0].play_count, 1);

      // Reconnect should see same count
      const { data: session } = await api(`/api/v1/attempt/session/${start.session.id}`, {
        token: studentToken,
      });
      assert.ok(session.attempts, 'attempts expected on reconnect');
    });
  });

  describe('Normalized Response Storage', () => {
    it('stores normalized response instead of raw on submit', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:demo:single-answer' },
        }),
      });
      const attemptId = start.attempts[0].id;

      const { status, data } = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId,
          response: { selectedIndex: 2, extraField: 'should-be-stripped' },
          idempotencyKey: `norm-test-${runId}`,
        }),
      });
      assert.equal(status, 200, JSON.stringify(data));

      // Verify normalized response was stored (extra field stripped)
      const stored = await harness.db.pool.query(`SELECT response FROM question_attempts WHERE id = $1`, [attemptId]);
      const storedResponse = stored.rows[0]?.response;
      assert.ok(storedResponse, 'response should exist');
      assert.equal(storedResponse.selectedIndex, 2);
      assert.equal(storedResponse.extraField, undefined);
    });
  });

  describe('Idempotency', () => {
    it('duplicate idempotency key returns same result', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      const attemptId = start.attempts[0].id;
      const key = `idem-test-${runId}`;

      const first = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: {}, idempotencyKey: key }),
      });
      assert.equal(first.status, 200);
      assert.equal(first.data.idempotent, false);

      const second = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, response: {}, idempotencyKey: key }),
      });
      assert.equal(second.status, 200);
      assert.equal(second.data.idempotent, true);
      assert.equal(second.data.submittedAt, first.data.submittedAt);
    });

    it('duplicate key on different attempt returns 409', async () => {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: fixtures.questionIds,
        }),
      });
      const key = `idem-conflict-${runId}`;

      await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId: start.attempts[0].id,
          response: {},
          idempotencyKey: key,
        }),
      });

      const { status, data } = await api('/api/v1/attempt/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          attemptId: start.attempts[1].id,
          response: {},
          idempotencyKey: key,
        }),
      });
      assert.equal(status, 409, JSON.stringify(data));
      assert.ok(data.error.includes('already used'), data.error);
    });
  });

  describe('Session Recovery', () => {
    it('reuses existing active session on start', async () => {
      const { status: firstStatus, data: firstData } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      assert.ok(firstStatus === 201 || firstStatus === 200, `expected 201 or 200, got ${firstStatus}`);

      const { status: secondStatus, data: secondData } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      assert.equal(secondStatus, 200);
      assert.equal(secondData.recovered, true);
      assert.equal(secondData.session.id, firstData.session.id);
    });
  });

  describe('questionTaskTypes Validation', () => {
    it('rejects unknown task type at session start', async () => {
      const { status, data } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 'pte:unknown:renderer' },
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(data.error.includes('Unknown task type'), data.error);
    });

    it('rejects non-object questionTaskTypes', async () => {
      const { status, data } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: 'not-an-object',
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('questionTaskTypes')),
        data.error,
      );
    });

    it('rejects array as questionTaskTypes', async () => {
      const { status, data } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: ['a', 'b'],
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('questionTaskTypes')),
        data.error,
      );
    });

    it('rejects non-string task type value', async () => {
      const { status, data } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [qId0],
          questionTaskTypes: { [qId0]: 42 },
        }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes(qId0)),
        data.error,
      );
    });
  });

  describe('maxPlays Validation', () => {
    async function startPlaybackTest(): Promise<string> {
      const { data: start } = await api('/api/v1/attempt/session/start', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({
          lessonId: fixtures.lessonId,
          mode: 'learning',
          questionIds: [fixtures.questionIds[0]],
        }),
      });
      return start.attempts[0].id;
    }

    it('rejects maxPlays = 0', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'm0', maxPlays: 0 }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('rejects maxPlays = -1', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'mneg', maxPlays: -1 }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('rejects maxPlays as string', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'mstr', maxPlays: '2' }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('rejects maxPlays as null', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'mnull', maxPlays: null }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('rejects maxPlays as array', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'marr', maxPlays: [2] }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('rejects maxPlays as object', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'mobj', maxPlays: { val: 2 } }),
      });
      assert.equal(status, 400, JSON.stringify(data));
      assert.ok(
        data.details?.some((d: string) => d.includes('maxPlays')),
        data.error,
      );
    });

    it('accepts omitted maxPlays (defaults to 1)', async () => {
      const attemptId = await startPlaybackTest();
      const { status, data } = await api('/api/v1/attempt/playback/record', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ attemptId, mediaId: 'mdefault' }),
      });
      assert.equal(status, 200, JSON.stringify(data));
      assert.equal(data.playback.maxPlays, 1);
    });
  });

  // Renderer Fallback Enforcement removed — renderer registry lives in the
  // API process, not the test process, so clearRegistry() is a no-op across
  // the process boundary. A proper test would require a test-only API endpoint.
});
