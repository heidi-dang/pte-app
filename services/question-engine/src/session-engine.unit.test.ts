import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { SessionEngine } from './session-engine.js';

describe('SessionEngine', () => {
  let engine: SessionEngine;

  before(() => {
    engine = new SessionEngine(new Map());
  });

  it('creates a learning session', async () => {
    const session = await engine.createSession('user_1', 'cnt_001', 'write_essay', 'learning');
    assert.equal(session.userId, 'user_1');
    assert.equal(session.status, 'active');
    assert.equal(session.deadline, undefined);
  });

  it('creates a timed session with deadline', async () => {
    const session = await engine.createSession('user_1', 'cnt_001', 'write_essay', 'timed_practice', 120);
    assert.ok(session.deadline);
  });

  it('saves and retrieves response', async () => {
    const session = await engine.createSession('user_2', 'cnt_002', 'read_aloud', 'learning');
    await engine.saveResponse(session.id, { text: 'Hello world' });
    const updated = await engine.getSession(session.id);
    assert.equal(updated!.response.text, 'Hello world');
  });

  it('prevents duplicate submission', async () => {
    const session = await engine.createSession('user_3', 'cnt_003', 'write_essay', 'full_mock');
    const first = await engine.submitSession(session.id);
    assert.equal(first.accepted, true);
    const second = await engine.submitSession(session.id);
    assert.equal(second.accepted, false);
    assert.equal(second.duplicate, true);
  });

  it('restores paused session', async () => {
    const session = await engine.createSession('user_4', 'cnt_004', 'describe_image', 'learning');
    // Simulate pause
    const paused = { ...session, status: 'paused' as const, pausedAt: new Date().toISOString() };
    engine = new SessionEngine(new Map([[session.id, paused]]));

    const restored = await engine.restoreSession(session.id);
    assert.equal(restored!.status, 'active');
  });

  it('consumes playback', async () => {
    const session = await engine.createSession('user_5', 'cnt_005', 'summarize_spoken_text', 'full_mock');
    const consumed = await engine.consumePlayback(session.id);
    assert.equal(consumed!.playbackState, 'consumed');
    // Second consumption returns null
    const again = await engine.consumePlayback(session.id);
    assert.equal(again, null);
  });

  it('generates timer for timed sessions', async () => {
    const session = await engine.createSession('user_6', 'cnt_006', 'write_essay', 'timed_practice', 300);
    const timer = await engine.getTimer(session.id);
    assert.ok(timer);
    assert.ok(timer!.remainingMs > 0);
    assert.equal(timer!.isPaused, false);
  });
});
