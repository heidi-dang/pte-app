import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { startTestHarness, type TestHarness } from '../phase-h/test-harness.js';
import { buildTestFixtures, type PhaseLTestFixtures } from './test-fixtures.js';

const runId = `phase-l-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
let fixtures: PhaseLTestFixtures;
let studentToken: string;
let otherStudentToken: string;
let recordingId: string;

describe('Phase L API Integration', () => {
  before(async () => {
    harness = await startTestHarness();
    fixtures = await buildTestFixtures(harness.db);
    studentToken = await login(fixtures.student.email, fixtures.student.password);
    otherStudentToken = await login(fixtures.otherStudent.email, fixtures.otherStudent.password);
  });

  after(async () => {
    await harness?.stop();
  });

  it('POST /api/v1/speaking/recording/start creates a recording with real attemptId', async () => {
    const { status, data } = await api('/api/v1/speaking/recording/start', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        attemptId: fixtures.attemptId,
        recordingProfileId: 'rp_default',
      }),
    });
    assert.equal(status, 201, `Expected 201: ${JSON.stringify(data)}`);
    assert.ok(data.recording, 'recording expected in response');
    assert.ok(data.recording.id, 'recording.id expected');
    assert.equal(data.recording.attempt_id, fixtures.attemptId, 'attempt_id should match');
    assert.equal(data.recording.recording_profile_id, 'rp_default');
    assert.equal(data.recording.user_id, fixtures.student.id, 'user_id should match student');
    assert.equal(data.resumed, false, 'should be new recording');
    recordingId = data.recording.id;
  });

  it('POST /api/v1/speaking/recording/start resumes existing recording (idempotent)', async () => {
    const { status, data } = await api('/api/v1/speaking/recording/start', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        attemptId: fixtures.attemptId,
        recordingProfileId: 'rp_default',
      }),
    });
    assert.equal(status, 200, `Expected 200: ${JSON.stringify(data)}`);
    assert.equal(data.resumed, true, 'should resume existing');
    assert.equal(data.recording.id, recordingId, 'same recording ID');
  });

  it('POST /api/v1/speaking/upload/start creates an upload session', async () => {
    const { status, data } = await api('/api/v1/speaking/upload/start', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        recordingId,
        totalChunks: 2,
      }),
    });
    assert.equal(status, 201, `Expected 201: ${JSON.stringify(data)}`);
    assert.ok(data.uploadSession, 'uploadSession expected');
    assert.ok(data.uploadSession.id, 'uploadSession.id expected');
    assert.equal(data.uploadSession.total_chunks, 2);
    assert.equal(data.uploadSession.state, 'active');
    assert.equal(data.resumed, false);
  });

  it('POST /api/v1/speaking/upload/chunk uploads chunks with real base64 data', async () => {
    const { data: sessionData } = await api('/api/v1/speaking/upload/start', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({ recordingId, totalChunks: 2 }),
    });
    const sessionId = sessionData.uploadSession.id;

    const fakeAudioData = Buffer.from('fake audio bytes').toString('base64');

    const chunk1 = await api('/api/v1/speaking/upload/chunk', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        uploadSessionId: sessionId,
        sequenceNumber: 0,
        byteCount: 15,
        data: fakeAudioData,
      }),
    });
    assert.equal(chunk1.status, 200, `Chunk 1 failed: ${JSON.stringify(chunk1.data)}`);
    assert.equal(chunk1.data.chunk.sequenceNumber, 0);

    const chunk2 = await api('/api/v1/speaking/upload/chunk', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        uploadSessionId: sessionId,
        sequenceNumber: 1,
        byteCount: 15,
        data: fakeAudioData,
      }),
    });
    assert.equal(chunk2.status, 200, `Chunk 2 failed: ${JSON.stringify(chunk2.data)}`);
    assert.equal(chunk2.data.chunk.sequenceNumber, 1);
  });

  it('POST /api/v1/speaking/upload/finalize finalises recording with server-issued ID', async () => {
    const { status, data } = await api('/api/v1/speaking/upload/finalize', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        recordingId,
        durationMs: 5000,
      }),
    });
    assert.equal(status, 200, `Expected 200: ${JSON.stringify(data)}`);
    assert.equal(data.recording.state, 'available', 'state should be available');
    assert.equal(data.recording.finalisation_state, 'finalised', 'should be finalised');
    assert.equal(data.recording.duration_ms, 5000);
    assert.equal(data.idempotent, false);
  });

  it('POST /api/v1/speaking/upload/finalize is idempotent when already finalised', async () => {
    const { status, data } = await api('/api/v1/speaking/upload/finalize', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({ recordingId }),
    });
    assert.equal(status, 200);
    assert.equal(data.idempotent, true);
  });

  it('GET /api/v1/speaking/recording/:id/status returns recording status', async () => {
    const { status, data } = await api(`/api/v1/speaking/recording/${recordingId}/status`, {
      method: 'GET',
      token: studentToken,
    });
    assert.equal(status, 200, `Expected 200: ${JSON.stringify(data)}`);
    assert.ok(data.recording, 'recording expected');
    assert.equal(data.recording.id, recordingId);
    assert.equal(data.isComplete, true);
    assert.equal(data.recording.state, 'available');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const { status } = await api('/api/v1/speaking/recording/start', {
      method: 'POST',
      body: JSON.stringify({ attemptId: 'test', recordingProfileId: 'test' }),
    });
    assert.equal(status, 401);
  });

  it('rejects invalid request body with 400', async () => {
    const { status } = await api('/api/v1/speaking/recording/start', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({}),
    });
    assert.equal(status, 400);
  });

  it('rejects wrong-owner access with 403', async () => {
    const otherAttemptId = randomUUID();
    await harness.db.pool.query(
      `INSERT INTO question_attempts (id, user_id, question_id, lesson_id, session_id, status, mode)
       VALUES ($1, $2, $3, $4, $5, 'created', 'learning')`,
      [
        otherAttemptId,
        fixtures.otherStudent.id,
        randomUUID(),
        fixtures.lessonId,
        fixtures.sessionId,
      ],
    );

    const { data: otherRec } = await api('/api/v1/speaking/recording/start', {
      method: 'POST',
      token: otherStudentToken,
      body: JSON.stringify({
        attemptId: otherAttemptId,
        recordingProfileId: 'rp_other',
      }),
    });
    const otherRecordingId = otherRec.recording.id;

    const res = await api(`/api/v1/speaking/recording/${otherRecordingId}/status`, {
      method: 'GET',
      token: studentToken,
    });
    assert.equal(res.status, 403, 'student should not access other student recording');
  });
});
