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
  UploadContractSchema,
  AttemptContractSchema,
  ResultContractSchema,
  FeedbackContractSchema,
  AuditEventContractSchema,
  VersionedConfigurationSchema,
  VersionedTimingProfileSchema,
  VersionedFeatureFlagsSchema,
  FeatureFlagsSchema,
  ConfigurationStatusSchema,
  ConfigurationScopeSchema,
  VersionedLanguageConfigSchema,
  VersionedQuestionMetadataConfigSchema,
  VersionedExamMetadataConfigSchema,
  VersionedMediaMetadataConfigSchema,
  TimingProfileConfigSchema,
  QuestionMetadataConfigSchema,
  ExamMetadataConfigSchema,
  MediaMetadataConfigSchema,
  LanguageMetadataConfigSchema,
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

    it('rejects a question with empty id', () => {
      const result = QuestionContractSchema.safeParse({
        id: '',
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
      assert.equal(result.success, false);
    });

    it('rejects a question with empty version', () => {
      const result = QuestionContractSchema.safeParse({
        id: 'q-1',
        version: '',
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

  describe('VersionedTimingProfileSchema', () => {
    it('accepts valid versioned timing', () => {
      const result = VersionedTimingProfileSchema.safeParse({
        id: 'cfg-timing-speaking-read-aloud',
        version: '1.0.0',
        status: 'active',
        profileId: 'training-speaking-read-aloud',
        taskType: 'read-aloud',
        section: 'speaking',
        preparationSeconds: 30,
        responseSeconds: 40,
        reviewSeconds: 10,
        source: 'estimated-training-configuration',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
        metadata: { note: 'training values' },
      });
      assert.equal(result.success, true);
    });

    it('rejects negative preparationSeconds', () => {
      const result = VersionedTimingProfileSchema.safeParse({
        id: 'cfg-timing-speaking-read-aloud',
        version: '1.0.0',
        status: 'active',
        profileId: 'training-speaking-read-aloud',
        taskType: 'read-aloud',
        section: 'speaking',
        preparationSeconds: -1,
        responseSeconds: 40,
        reviewSeconds: 10,
        source: 'estimated-training-configuration',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
        metadata: {},
      });
      assert.equal(result.success, false);
    });

    it('rejects missing id', () => {
      const result = VersionedTimingProfileSchema.safeParse({
        version: '1.0.0',
        status: 'active',
        profileId: 'test',
        taskType: 'read-aloud',
        section: 'speaking',
        preparationSeconds: 30,
        responseSeconds: 40,
        reviewSeconds: 10,
        source: 'test',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
        metadata: {},
      });
      assert.equal(result.success, false);
    });

    it('rejects missing source', () => {
      const result = VersionedTimingProfileSchema.safeParse({
        id: 'cfg-1',
        version: '1.0.0',
        status: 'active',
        profileId: 'test',
        taskType: 'read-aloud',
        section: 'speaking',
        preparationSeconds: 30,
        responseSeconds: 40,
        reviewSeconds: 10,
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
        metadata: {},
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

    it('accepts number flags', () => {
      const result = FeatureFlagsSchema.safeParse({
        maxRetries: 3,
      });
      assert.equal(result.success, true);
    });
  });

  describe('VersionedFeatureFlagsSchema', () => {
    it('accepts valid versioned feature flags', () => {
      const result = VersionedFeatureFlagsSchema.safeParse({
        id: 'cfg-features-default',
        version: '1.0.0',
        status: 'active',
        environment: 'production',
        flags: { darkMode: false },
        source: 'estimated-training-configuration',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
      });
      assert.equal(result.success, true);
    });

    it('rejects invalid status', () => {
      const result = VersionedFeatureFlagsSchema.safeParse({
        id: 'cfg-features-default',
        version: '1.0.0',
        status: 'INVALID',
        environment: 'production',
        flags: {},
        source: 'test',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
      });
      assert.equal(result.success, false);
    });

    it('rejects missing environment', () => {
      const result = VersionedFeatureFlagsSchema.safeParse({
        id: 'cfg-features-default',
        version: '1.0.0',
        status: 'active',
        flags: {},
        source: 'test',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
      });
      assert.equal(result.success, false);
    });
  });

  describe('ConfigurationStatusSchema', () => {
    it('accepts active', () => assert.equal(ConfigurationStatusSchema.safeParse('active').success, true));
    it('accepts deprecated', () => assert.equal(ConfigurationStatusSchema.safeParse('deprecated').success, true));
    it('accepts superseded', () => assert.equal(ConfigurationStatusSchema.safeParse('superseded').success, true));
    it('accepts draft', () => assert.equal(ConfigurationStatusSchema.safeParse('draft').success, true));
    it('rejects unknown', () => assert.equal(ConfigurationStatusSchema.safeParse('unknown').success, false));
    it('rejects empty', () => assert.equal(ConfigurationStatusSchema.safeParse('').success, false));
  });

  describe('ConfigurationScopeSchema', () => {
    it('accepts all valid scopes', () => {
      assert.equal(ConfigurationScopeSchema.safeParse('global').success, true);
      assert.equal(ConfigurationScopeSchema.safeParse('exam').success, true);
      assert.equal(ConfigurationScopeSchema.safeParse('question').success, true);
      assert.equal(ConfigurationScopeSchema.safeParse('user').success, true);
      assert.equal(ConfigurationScopeSchema.safeParse('feature').success, true);
    });
    it('rejects invalid scope', () => assert.equal(ConfigurationScopeSchema.safeParse('invalid').success, false));
  });

  describe('VersionedConfigurationSchema', () => {
    it('accepts valid versioned configuration', () => {
      const result = VersionedConfigurationSchema.safeParse({
        id: 'cfg-1',
        version: '1.0.0',
        status: 'active',
        key: 'timing.read-aloud',
        value: { preparationSeconds: 30 },
        scope: 'question',
        environment: 'production',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        source: 'test',
        supersededBy: null,
        migrationCompatibility: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
      assert.equal(result.success, true);
    });

    it('rejects invalid status', () => {
      const result = VersionedConfigurationSchema.safeParse({
        id: 'cfg-1',
        version: '1.0.0',
        status: 'INVALID',
        key: 'test',
        value: {},
        scope: 'global',
        environment: 'production',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        source: 'test',
        supersededBy: null,
        migrationCompatibility: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
      assert.equal(result.success, false);
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

    it('rejects invalid eventType', () => {
      const result = AuditEventContractSchema.safeParse({
        id: 'ae-1',
        version: '1.0.0',
        eventType: 'INVALID',
        actorId: 'u-1',
        targetType: 'question',
        targetId: 'q-1',
        changes: {},
        timestamp: '2026-01-01T00:00:00Z',
        ipAddress: null,
        userAgent: null,
        metadata: {},
      });
      assert.equal(result.success, false);
    });
  });

  describe('VersionedLanguageConfigSchema', () => {
    it('accepts valid config', () => {
      const result = VersionedLanguageConfigSchema.safeParse({
        id: 'cfg-languages-default',
        version: '1.0.0',
        status: 'active',
        languages: [{ code: 'en', name: 'English', nativeName: 'English', enabled: true }],
        source: 'estimated-training-configuration',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
      });
      assert.equal(result.success, true);
    });

    it('rejects invalid status', () => {
      const result = VersionedLanguageConfigSchema.safeParse({
        id: 'cfg-languages-default',
        version: '1.0.0',
        status: 'INVALID',
        languages: [],
        source: 'test',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        supersededBy: null,
      });
      assert.equal(result.success, false);
    });
  });

  describe('config sub-schemas', () => {
    it('TimingProfileConfigSchema accepts valid', () => {
      assert.equal(
        TimingProfileConfigSchema.safeParse({ preparationSeconds: 0, responseSeconds: 40, reviewSeconds: 10 }).success,
        true,
      );
    });

    it('QuestionMetadataConfigSchema accepts valid', () => {
      assert.equal(
        QuestionMetadataConfigSchema.safeParse({
          maxPromptLength: 5000,
          supportedMediaTypes: ['audio'],
          scoringCriteria: ['content'],
        }).success,
        true,
      );
    });

    it('ExamMetadataConfigSchema accepts valid', () => {
      assert.equal(ExamMetadataConfigSchema.safeParse({ maxTasks: 20, maxTimeMinutes: 180 }).success, true);
    });

    it('MediaMetadataConfigSchema accepts valid', () => {
      assert.equal(
        MediaMetadataConfigSchema.safeParse({
          maxFileSizeBytes: 104857600,
          allowedMimeTypes: ['audio/mpeg'],
          maxDurationSeconds: 600,
        }).success,
        true,
      );
    });

    it('LanguageMetadataConfigSchema accepts valid', () => {
      assert.equal(
        LanguageMetadataConfigSchema.safeParse({ code: 'en', name: 'English', nativeName: 'English', enabled: true })
          .success,
        true,
      );
    });

    it('LanguageMetadataConfigSchema rejects short code', () => {
      assert.equal(
        LanguageMetadataConfigSchema.safeParse({ code: 'e', name: 'English', nativeName: 'English', enabled: true })
          .success,
        false,
      );
    });
  });

  describe('complete barrel exports', () => {
    it('exports all expected schemas', async () => {
      const mod = await import('./index.js');
      assert.ok('QuestionContractSchema' in mod);
      assert.ok('AnswerContractSchema' in mod);
      assert.ok('ExamContractSchema' in mod);
      assert.ok('SessionContractSchema' in mod);
      assert.ok('UserProfileContractSchema' in mod);
      assert.ok('CourseContractSchema' in mod);
      assert.ok('LessonContractSchema' in mod);
      assert.ok('ProgressContractSchema' in mod);
      assert.ok('UploadContractSchema' in mod);
      assert.ok('AttemptContractSchema' in mod);
      assert.ok('ResultContractSchema' in mod);
      assert.ok('FeedbackContractSchema' in mod);
      assert.ok('AuditEventContractSchema' in mod);
      assert.ok('VersionedConfigurationSchema' in mod);
      assert.ok('VersionedTimingProfileSchema' in mod);
      assert.ok('VersionedFeatureFlagsSchema' in mod);
      assert.ok('VersionedLanguageConfigSchema' in mod);
      assert.ok('ConfigurationStatusSchema' in mod);
      assert.ok('ConfigurationScopeSchema' in mod);
    });
  });
});
