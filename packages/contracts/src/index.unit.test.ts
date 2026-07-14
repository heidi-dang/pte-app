import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  QuestionContract,
  AnswerContract,
  ExamContract,
  SessionContract,
  UserProfileContract,
  CourseContract,
  LessonContract,
  ProgressContract,
  MediaContract,
  UploadContract,
  AttemptContract,
  ResultContract,
  FeedbackContract,
  AuditEventContract,
  ConfigurationContract,
} from './index.js';
import { CONTRACT_VERSION } from './index.js';

describe('contracts', () => {
  it('CONTRACT_VERSION is 1.0.0', () => {
    assert.equal(CONTRACT_VERSION, '1.0.0');
  });

  describe('QuestionContract', () => {
    it('is assignable with valid data', () => {
      const q: QuestionContract = {
        id: 'q-1' as any,
        version: '1.0.0' as any,
        taskType: 'read-aloud',
        section: 'speaking',
        skillAssessed: 'oral-fluency',
        prompt: 'Read the text aloud',
        media: [],
        timeLimitSeconds: 40,
        preparationSeconds: null,
        maximumAttempts: 1,
        scoringPrinciples: [],
        metadata: {},
        createdAt: '2026-01-01T00:00:00Z' as any,
        updatedAt: '2026-01-01T00:00:00Z' as any,
      };
      assert.equal(q.id, 'q-1');
      assert.equal(q.taskType, 'read-aloud');
    });
  });

  describe('SessionContract', () => {
    it('is assignable with valid status', () => {
      const s: SessionContract = {
        id: 's-1' as any,
        version: '1.0.0' as any,
        examId: 'e-1' as any,
        userId: 'u-1' as any,
        status: 'active',
        startedAt: '2026-01-01T00:00:00Z' as any,
        expiresAt: '2026-01-01T01:00:00Z' as any,
        completedAt: null,
        currentTaskIndex: 0,
        answers: [],
        metadata: {},
      };
      assert.equal(s.status, 'active');
    });
  });

  describe('AuditEventContract', () => {
    it('is assignable with valid event type', () => {
      const e: AuditEventContract = {
        id: 'ae-1' as any,
        version: '1.0.0' as any,
        eventType: 'created',
        actorId: 'u-1' as any,
        targetType: 'question',
        targetId: 'q-1',
        changes: {},
        timestamp: '2026-01-01T00:00:00Z' as any,
        ipAddress: null,
        userAgent: null,
        metadata: {},
      };
      assert.equal(e.eventType, 'created');
    });
  });

  describe('ConfigurationContract', () => {
    it('is assignable with valid scope', () => {
      const c: ConfigurationContract = {
        id: 'cfg-1' as any,
        version: '1.0.0' as any,
        key: 'timing.read-aloud',
        value: { preparationSeconds: 30, responseSeconds: 40 },
        scope: 'question',
        environment: 'production',
        createdAt: '2026-01-01T00:00:00Z' as any,
        updatedAt: '2026-01-01T00:00:00Z' as any,
      };
      assert.equal(c.scope, 'question');
    });
  });
});
