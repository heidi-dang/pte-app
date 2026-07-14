import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  QuestionContractSchema,
  AnswerContractSchema,
  ExamContractSchema,
  SessionContractSchema,
  UserProfileContractSchema,
  CourseContractSchema,
  LessonContractSchema,
  ProgressContractSchema,
  MediaContractSchema,
  UploadContractSchema,
  AttemptContractSchema,
  ResultContractSchema,
  FeedbackContractSchema,
  AuditEventContractSchema,
  ConfigurationContractSchema,
  TimingProfileSchema,
  FeatureFlagsSchema,
} from './index.js';

describe('schemas', () => {
  describe('QuestionContractSchema', () => {
    it('accepts a valid question', () => {
      const result = QuestionContractSchema.safeParse({
        id: 'q-1',
        version: '1.0.0',
        taskType: 'read-aloud',
        section: 'speaking',
        skillAssessed: 'oral-fluency',
        prompt: 'Read the text',
        media: [],
        timeLimitSeconds: 40,
        preparationSeconds: null,
        maximumAttempts: 1,
        scoringPrinciples: [],
        metadata: {},
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
      assert.equal(result.success, true);
    });

    it('rejects a question without id', () => {
      const result = QuestionContractSchema.safeParse({
        version: '1.0.0',
        taskType: 'read-aloud',
      });
      assert.equal(result.success, false);
    });
  });

  describe('SessionContractSchema', () => {
    it('accepts valid session status', () => {
      const result = SessionContractSchema.safeParse({
        id: 's-1',
        version: '1.0.0',
        examId: 'e-1',
        userId: 'u-1',
        status: 'active',
        startedAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-01-01T01:00:00Z',
        completedAt: null,
        currentTaskIndex: 0,
        answers: [],
        metadata: {},
      });
      assert.equal(result.success, true);
    });

    it('rejects invalid status', () => {
      const result = SessionContractSchema.safeParse({
        id: 's-1',
        version: '1.0.0',
        examId: 'e-1',
        userId: 'u-1',
        status: 'INVALID',
        startedAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-01-01T01:00:00Z',
        completedAt: null,
        currentTaskIndex: 0,
        answers: [],
        metadata: {},
      });
      assert.equal(result.success, false);
    });
  });

  describe('TimingProfileSchema', () => {
    it('accepts valid timing', () => {
      const result = TimingProfileSchema.safeParse({
        preparationSeconds: 30,
        responseSeconds: 40,
        reviewSeconds: 10,
      });
      assert.equal(result.success, true);
    });

    it('rejects negative values', () => {
      const result = TimingProfileSchema.safeParse({
        preparationSeconds: -1,
        responseSeconds: 40,
        reviewSeconds: 10,
      });
      assert.equal(result.success, false);
    });
  });

  describe('FeatureFlagsSchema', () => {
    it('accepts boolean flags', () => {
      const result = FeatureFlagsSchema.safeParse({
        darkMode: true,
        beta: false,
      });
      assert.equal(result.success, true);
    });

    it('accepts string flags', () => {
      const result = FeatureFlagsSchema.safeParse({
        version: 'v2',
      });
      assert.equal(result.success, true);
    });
  });

  describe('AuditEventContractSchema', () => {
    it('accepts valid audit event', () => {
      const result = AuditEventContractSchema.safeParse({
        id: 'ae-1',
        version: '1.0.0',
        eventType: 'published',
        actorId: 'u-1',
        targetType: 'question',
        targetId: 'q-1',
        changes: { status: 'reviewed' },
        timestamp: '2026-01-01T00:00:00Z',
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        metadata: {},
      });
      assert.equal(result.success, true);
    });
  });
});
