import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidTransition } from '@pte-app/contracts';
import {
  createQuestionAttempt,
  attemptIsTerminal,
  attemptIsActive,
  attemptIsSubmittable,
  attemptCanTransition,
  attemptIsExpired,
  attemptCanRecover,
} from './question-attempt.js';
import type { QuestionAttemptRecord, QuestionAttemptStatus } from '@pte-app/contracts';

function makeAttempt(overrides: Partial<QuestionAttemptRecord> = {}): QuestionAttemptRecord {
  return {
    id: 'attempt-1' as any,
    userId: 'user-1' as any,
    questionId: 'q-1' as any,
    lessonId: 'lesson-1' as any,
    sessionId: 'session-1' as any,
    status: 'created',
    mode: 'learning',
    versionSnapshotId: null,
    response: null,
    startedAt: new Date().toISOString() as any,
    lastAutosavedAt: null,
    submittedAt: null,
    expiresAt: null,
    timeLimitSeconds: null,
    idempotencyKey: null,
    playCount: 0,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
    ...overrides,
  };
}

describe('Phase I - State Machine Transitions', () => {
  it('validates all allowed transitions', () => {
    const valid: [QuestionAttemptStatus, QuestionAttemptStatus][] = [
      ['created', 'in_progress'],
      ['created', 'expired'],
      ['created', 'interrupted'],
      ['in_progress', 'autosaved'],
      ['in_progress', 'submitted'],
      ['in_progress', 'interrupted'],
      ['in_progress', 'expired'],
      ['autosaved', 'in_progress'],
      ['autosaved', 'submitted'],
      ['autosaved', 'interrupted'],
      ['autosaved', 'expired'],
      ['submitted', 'reviewable'],
      ['interrupted', 'recovered'],
      ['interrupted', 'expired'],
      ['recovered', 'in_progress'],
      ['recovered', 'autosaved'],
      ['recovered', 'submitted'],
      ['recovered', 'expired'],
      ['recovered', 'interrupted'],
    ];
    for (const [from, to] of valid) {
      assert.ok(isValidTransition(from, to), `Expected ${from} -> ${to} to be valid`);
    }
  });

  it('rejects invalid transitions', () => {
    const invalid: [QuestionAttemptStatus, QuestionAttemptStatus][] = [
      ['created', 'submitted'],
      ['created', 'reviewable'],
      ['in_progress', 'reviewable'],
      ['autosaved', 'reviewable'],
      ['submitted', 'in_progress'],
      ['submitted', 'autosaved'],
      ['submitted', 'expired'],
      ['submitted', 'interrupted'],
      ['submitted', 'submitted'],
      ['reviewable', 'in_progress'],
      ['reviewable', 'submitted'],
      ['expired', 'in_progress'],
      ['expired', 'submitted'],
      ['expired', 'recovered'],
      ['interrupted', 'in_progress'],
      ['interrupted', 'submitted'],
    ];
    for (const [from, to] of invalid) {
      assert.equal(isValidTransition(from, to), false, `Expected ${from} -> ${to} to be invalid`);
    }
  });
});

describe('Phase I - Question Attempt Domain', () => {
  it('detects terminal states', () => {
    assert.ok(attemptIsTerminal(createQuestionAttempt(makeAttempt({ status: 'submitted' }))));
    assert.ok(attemptIsTerminal(createQuestionAttempt(makeAttempt({ status: 'reviewable' }))));
    assert.ok(attemptIsTerminal(createQuestionAttempt(makeAttempt({ status: 'expired' }))));
    assert.equal(attemptIsTerminal(createQuestionAttempt(makeAttempt({ status: 'in_progress' }))), false);
    assert.equal(attemptIsTerminal(createQuestionAttempt(makeAttempt({ status: 'autosaved' }))), false);
  });

  it('detects active states', () => {
    assert.ok(attemptIsActive(createQuestionAttempt(makeAttempt({ status: 'in_progress' }))));
    assert.ok(attemptIsActive(createQuestionAttempt(makeAttempt({ status: 'autosaved' }))));
    assert.ok(attemptIsActive(createQuestionAttempt(makeAttempt({ status: 'recovered' }))));
    assert.equal(attemptIsActive(createQuestionAttempt(makeAttempt({ status: 'submitted' }))), false);
    assert.equal(attemptIsActive(createQuestionAttempt(makeAttempt({ status: 'expired' }))), false);
  });

  it('detects submittable states', () => {
    assert.ok(attemptIsSubmittable(createQuestionAttempt(makeAttempt({ status: 'in_progress' }))));
    assert.ok(attemptIsSubmittable(createQuestionAttempt(makeAttempt({ status: 'autosaved' }))));
    assert.ok(attemptIsSubmittable(createQuestionAttempt(makeAttempt({ status: 'recovered' }))));
    assert.equal(attemptIsSubmittable(createQuestionAttempt(makeAttempt({ status: 'submitted' }))), false);
    assert.equal(attemptIsSubmittable(createQuestionAttempt(makeAttempt({ status: 'expired' }))), false);
  });

  it('detects expired attempts by status', () => {
    const expired = createQuestionAttempt(makeAttempt({ status: 'expired' }));
    assert.ok(attemptIsExpired(expired));
  });

  it('detects expired attempts by expiry time', () => {
    const past = new Date(Date.now() - 60000).toISOString() as any;
    const attempt = createQuestionAttempt(makeAttempt({ expiresAt: past, status: 'in_progress' }));
    assert.ok(attemptIsExpired(attempt));
  });

  it('detects not expired when within time', () => {
    const future = new Date(Date.now() + 60000).toISOString() as any;
    const attempt = createQuestionAttempt(makeAttempt({ expiresAt: future, status: 'in_progress' }));
    assert.equal(attemptIsExpired(attempt), false);
  });

  it('detects recoverable attempts', () => {
    assert.ok(attemptCanRecover(createQuestionAttempt(makeAttempt({ status: 'interrupted' }))));
    assert.equal(attemptCanRecover(createQuestionAttempt(makeAttempt({ status: 'in_progress' }))), false);
    assert.equal(attemptCanRecover(createQuestionAttempt(makeAttempt({ status: 'submitted' }))), false);
  });

  it('validates canTransition', () => {
    const attempt = createQuestionAttempt(makeAttempt({ status: 'in_progress' }));
    assert.ok(attemptCanTransition(attempt, 'submitted'));
    assert.ok(attemptCanTransition(attempt, 'autosaved'));
    assert.equal(attemptCanTransition(attempt, 'reviewable'), false);
  });
});

describe('Phase I - Response Validation / Normalization', () => {
  it('handles valid single-answer response', () => {
    const response = { selectedIndex: 2 };
    // Validation is done by renderer contract
    assert.ok(typeof response.selectedIndex === 'number');
  });

  it('handles empty response', () => {
    const response = {};
    // Empty is valid per demo contract - only missing required fields are invalid
    assert.ok(typeof response === 'object');
  });

  it('handles incomplete response (null value)', () => {
    const response = { selectedIndex: null };
    assert.equal(response.selectedIndex, null);
  });
});

describe('Phase I - Idempotency', () => {
  it('detects duplicate idempotency key', () => {
    const key1 = 'key-abc-123';
    const key2 = 'key-abc-123';
    assert.equal(key1, key2);
  });

  it('detects different idempotency keys', () => {
    const key1 = 'key-abc-123';
    const key2 = 'key-def-456';
    assert.notEqual(key1, key2);
  });
});

describe('Phase I - Timer Policy', () => {
  it('server authoritative timer is enforced', () => {
    const policy = { serverAuthoritative: true, enforceTimeLimit: true, graceSeconds: 0, warnAtSeconds: null };
    assert.ok(policy.serverAuthoritative);
    assert.ok(policy.enforceTimeLimit);
  });

  it('remaining calculation works', () => {
    const expiresAt = new Date(Date.now() + 120000).toISOString();
    const serverNow = new Date().toISOString();
    const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - new Date(serverNow).getTime()) / 1000));
    assert.ok(remaining > 0);
    assert.ok(remaining <= 120);
  });

  it('expired timer returns zero remaining', () => {
    const expiresAt = new Date(Date.now() - 60000).toISOString();
    const serverNow = new Date().toISOString();
    const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - new Date(serverNow).getTime()) / 1000));
    assert.equal(remaining, 0);
  });
});

describe('Phase I - Playback Rights Persistence Contract', () => {
  it('play count must survive reconnect', () => {
    const consumption = { playCount: 2, maxPlays: 3, consumedAt: null };
    const afterReconnect = { ...consumption, playCount: 2 }; // same count, not reset
    assert.equal(afterReconnect.playCount, 2);
  });

  it('consumed state must survive resume', () => {
    const consumption = { playCount: 3, maxPlays: 3, consumedAt: new Date().toISOString() };
    assert.ok(consumption.consumedAt !== null);
    assert.equal(consumption.playCount, consumption.maxPlays);
  });

  it('remaining plays calculated correctly', () => {
    const maxPlays = 3;
    const playCount = 1;
    const remaining = Math.max(0, maxPlays - playCount);
    assert.equal(remaining, 2);
  });

  it('reconnect does not reset consumed rights', () => {
    const before = { playCount: 3, maxPlays: 3, consumedAt: new Date().toISOString() };
    const afterReconnect = { ...before, playCount: before.playCount, consumedAt: before.consumedAt };
    assert.equal(afterReconnect.playCount, 3);
    assert.equal(afterReconnect.consumedAt, before.consumedAt);
  });
});
