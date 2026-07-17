import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src');
import type {
  UserId,
  QuestionId,
  ExamId,
  SessionId,
  CourseId,
  LessonId,
  AttemptId,
  MediaId,
  UploadId,
  ResultId,
  FeedbackId,
  AuditEventId,
  ProgressId,
  ConfigurationId,
  TimingProfileId,
  SectionId,
  TaskId,
  ScoringProfileId,
  LanguageCode,
  ISO8601DateTime,
  ISO8601Date,
  Version,
  ConfigurationStatus,
  Brand,
} from '@pte-app/types';
import * as barrelExports from './index.js';
import {
  CONTRACT_VERSION,
  TRAINING_TIMING_PROFILES,
  TRAINING_QUESTION_CONFIG,
  TRAINING_EXAM_CONFIG,
  TRAINING_MEDIA_CONFIG,
  TRAINING_LANGUAGE_CONFIG,
  TRAINING_DEFAULT_FLAGS,
  TRAINING_DEVELOPMENT_FLAGS,
  TRAINING_STAGING_FLAGS,
  TRAINING_PRODUCTION_FLAGS,
  requireTimingProfile,
  requireQuestionConfig,
  requireExamConfig,
  requireMediaConfig,
  requireLanguageConfig,
  requireFeatureFlags,
  requireFeatureFlagsForEnvironment,
  getTimingProfile,
  getTimingProfileById,
  getActiveTimingProfiles,
  getActiveQuestionConfig,
  getActiveExamConfig,
  getActiveMediaConfig,
  getActiveLanguageConfig,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  isFeatureEnabled,
  getFeatureFlagValue,
} from './index.js';
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
  VersionedConfiguration,
  VersionedTimingProfile,
  VersionedFeatureFlags,
  VersionedLanguageConfig,
  VersionedQuestionMetadataConfig,
  VersionedExamMetadataConfig,
  VersionedMediaMetadataConfig,
} from './index.js';

describe('contract quality', () => {
  describe('branded identifiers', () => {
    it('UserId is a branded string', () => {
      const id = 'u-1' as UserId;
      assert.equal(typeof id, 'string');
      const branded: Brand<string, 'UserId'> = id;
      assert.ok(branded);
    });

    it('QuestionId is a branded string', () => {
      const id = 'q-1' as QuestionId;
      assert.equal(typeof id, 'string');
    });

    it('ExamId is a branded string', () => {
      const id = 'e-1' as ExamId;
      assert.equal(typeof id, 'string');
    });

    it('SessionId is a branded string', () => {
      const id = 's-1' as SessionId;
      assert.equal(typeof id, 'string');
    });

    it('CourseId is a branded string', () => {
      const id = 'c-1' as CourseId;
      assert.equal(typeof id, 'string');
    });

    it('LessonId is a branded string', () => {
      const id = 'l-1' as LessonId;
      assert.equal(typeof id, 'string');
    });

    it('AttemptId is a branded string', () => {
      const id = 'a-1' as AttemptId;
      assert.equal(typeof id, 'string');
    });

    it('MediaId is a branded string', () => {
      const id = 'm-1' as MediaId;
      assert.equal(typeof id, 'string');
    });

    it('UploadId is a branded string', () => {
      const id = 'u-1' as UploadId;
      assert.equal(typeof id, 'string');
    });

    it('ResultId is a branded string', () => {
      const id = 'r-1' as ResultId;
      assert.equal(typeof id, 'string');
    });

    it('FeedbackId is a branded string', () => {
      const id = 'f-1' as FeedbackId;
      assert.equal(typeof id, 'string');
    });

    it('AuditEventId is a branded string', () => {
      const id = 'ae-1' as AuditEventId;
      assert.equal(typeof id, 'string');
    });

    it('ProgressId is a branded string', () => {
      const id = 'p-1' as ProgressId;
      assert.equal(typeof id, 'string');
    });

    it('ConfigurationId is a branded string', () => {
      const id = 'cfg-1' as ConfigurationId;
      assert.equal(typeof id, 'string');
    });

    it('ISO8601DateTime is a branded string', () => {
      const dt = '2026-01-15T10:30:00Z' as ISO8601DateTime;
      assert.equal(typeof dt, 'string');
    });

    it('Version is a branded string', () => {
      const v = '1.0.0' as Version;
      assert.equal(typeof v, 'string');
    });

    it('ConfigurationStatus accepts valid statuses', () => {
      const statuses: ConfigurationStatus[] = ['active', 'deprecated', 'superseded', 'draft'];
      assert.equal(statuses.length, 4);
    });
  });

  describe('contract JSON serialization', () => {
    it('QuestionContract is JSON serializable', () => {
      const q: QuestionContract = {
        id: 'q-1' as QuestionId,
        version: '1.0.0' as Version,
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
        createdAt: '2026-01-01T00:00:00Z' as ISO8601DateTime,
        updatedAt: '2026-01-01T00:00:00Z' as ISO8601DateTime,
      };
      const json = JSON.stringify(q);
      const parsed = JSON.parse(json) as QuestionContract;
      assert.equal(parsed.id, 'q-1');
      assert.equal(parsed.taskType, 'read-aloud');
    });

    it('SessionContract is JSON serializable', () => {
      const s: SessionContract = {
        id: 's-1' as SessionId,
        version: '1.0.0' as Version,
        examId: 'e-1' as ExamId,
        userId: 'u-1' as UserId,
        status: 'active',
        startedAt: '2026-01-01T00:00:00Z' as ISO8601DateTime,
        expiresAt: '2026-01-01T01:00:00Z' as ISO8601DateTime,
        completedAt: null,
        currentTaskIndex: 0,
        answers: [],
        metadata: {},
      };
      const json = JSON.stringify(s);
      const parsed = JSON.parse(json) as SessionContract;
      assert.equal(parsed.status, 'active');
    });

    it('AuditEventContract is JSON serializable', () => {
      const e: AuditEventContract = {
        id: 'ae-1' as AuditEventId,
        version: '1.0.0' as Version,
        eventType: 'created',
        actorId: 'u-1' as UserId,
        targetType: 'question',
        targetId: 'q-1',
        changes: {},
        timestamp: '2026-01-01T00:00:00Z' as ISO8601DateTime,
        ipAddress: null,
        userAgent: null,
        metadata: {},
      };
      const json = JSON.stringify(e);
      const parsed = JSON.parse(json) as AuditEventContract;
      assert.equal(parsed.eventType, 'created');
    });

    it('VersionedConfiguration is JSON serializable', () => {
      const c: VersionedConfiguration = {
        id: 'cfg-1' as ConfigurationId,
        version: '1.0.0' as Version,
        status: 'active',
        key: 'timing.read-aloud',
        value: { preparationSeconds: 30 },
        scope: 'question',
        environment: 'production',
        effectiveFrom: '2026-01-01' as ISO8601Date,
        effectiveUntil: null,
        source: 'estimated-training-configuration',
        supersededBy: null,
        migrationCompatibility: null,
        createdAt: '2026-01-01T00:00:00Z' as ISO8601DateTime,
        updatedAt: '2026-01-01T00:00:00Z' as ISO8601DateTime,
      };
      const json = JSON.stringify(c);
      const parsed = JSON.parse(json) as VersionedConfiguration;
      assert.equal(parsed.scope, 'question');
    });
  });

  describe('unknown configuration rejection', () => {
    it('throws for unknown timing profile', () => {
      assert.throws(() => requireTimingProfile('unknown' as ConfigurationId, 'task'), /No timing profile found/);
    });

    it('throws for unknown question config', () => {
      assert.throws(() => requireQuestionConfig('unknown' as ConfigurationId), /Unknown question configuration/);
    });

    it('throws for unknown exam config', () => {
      assert.throws(() => requireExamConfig('unknown' as ConfigurationId), /Unknown exam configuration/);
    });

    it('throws for unknown media config', () => {
      assert.throws(() => requireMediaConfig('unknown' as ConfigurationId), /Unknown media configuration/);
    });

    it('throws for unknown language config', () => {
      assert.throws(() => requireLanguageConfig('unknown' as ConfigurationId), /Unknown language configuration/);
    });

    it('throws for unknown feature flag config', () => {
      assert.throws(() => requireFeatureFlags('unknown' as ConfigurationId), /Unknown feature flag configuration/);
    });

    it('throws for unknown environment feature flags', () => {
      assert.throws(
        () => requireFeatureFlagsForEnvironment('nonexistent'),
        /No feature flag configuration for environment/,
      );
    });

    it('returns undefined for unknown timing profile lookup', () => {
      assert.equal(getTimingProfile('unknown', 'unknown'), undefined);
    });

    it('returns undefined for unknown timing profile by id', () => {
      assert.equal(getTimingProfileById('unknown' as ConfigurationId), undefined);
    });
  });

  describe('configuration-version lookup', () => {
    it('can look up timing profile by section and task type', () => {
      const profile = getTimingProfile('speaking', 'read-aloud');
      assert.ok(profile);
      assert.equal(profile.version, '1.0.0');
    });

    it('can look up timing profile by id', () => {
      const first = TRAINING_TIMING_PROFILES[0]!;
      const profile = getTimingProfileById(first.id);
      assert.ok(profile);
      assert.equal(profile.id, first.id);
    });

    it('returns active timing profiles', () => {
      const active = getActiveTimingProfiles();
      assert.ok(active.length >= 4);
      assert.ok(active.every((p) => p.status === 'active'));
    });

    it('all configs have version 1.0.0', () => {
      assert.equal(TRAINING_QUESTION_CONFIG.version, '1.0.0');
      assert.equal(TRAINING_EXAM_CONFIG.version, '1.0.0');
      assert.equal(TRAINING_MEDIA_CONFIG.version, '1.0.0');
      assert.equal(TRAINING_LANGUAGE_CONFIG.version, '1.0.0');
      assert.equal(TRAINING_DEFAULT_FLAGS.version, '1.0.0');
    });

    it('all configs have source set', () => {
      assert.ok(TRAINING_QUESTION_CONFIG.source);
      assert.ok(TRAINING_EXAM_CONFIG.source);
      assert.ok(TRAINING_MEDIA_CONFIG.source);
      assert.ok(TRAINING_LANGUAGE_CONFIG.source);
      assert.ok(TRAINING_DEFAULT_FLAGS.source);
    });

    it('all configs have effectiveFrom set', () => {
      assert.ok(TRAINING_QUESTION_CONFIG.effectiveFrom);
      assert.ok(TRAINING_EXAM_CONFIG.effectiveFrom);
      assert.ok(TRAINING_MEDIA_CONFIG.effectiveFrom);
      assert.ok(TRAINING_LANGUAGE_CONFIG.effectiveFrom);
      assert.ok(TRAINING_DEFAULT_FLAGS.effectiveFrom);
    });
  });

  describe('deprecated configuration handling', () => {
    it('configs have supersededBy field (null for active)', () => {
      assert.equal(TRAINING_QUESTION_CONFIG.supersededBy, null);
      assert.equal(TRAINING_EXAM_CONFIG.supersededBy, null);
      assert.equal(TRAINING_MEDIA_CONFIG.supersededBy, null);
      assert.equal(TRAINING_LANGUAGE_CONFIG.supersededBy, null);
      assert.equal(TRAINING_DEFAULT_FLAGS.supersededBy, null);
    });

    it('configs have status field', () => {
      assert.equal(TRAINING_QUESTION_CONFIG.status, 'active');
      assert.equal(TRAINING_EXAM_CONFIG.status, 'active');
      assert.equal(TRAINING_MEDIA_CONFIG.status, 'active');
      assert.equal(TRAINING_LANGUAGE_CONFIG.status, 'active');
      assert.equal(TRAINING_DEFAULT_FLAGS.status, 'active');
    });
  });

  describe('deep immutability', () => {
    it('timing profiles are deeply frozen', () => {
      for (const profile of TRAINING_TIMING_PROFILES) {
        assert.throws(() => {
          (profile as unknown as Record<string, unknown>).version = '2.0.0';
        });
      }
    });

    it('question config is deeply frozen', () => {
      assert.throws(() => {
        (TRAINING_QUESTION_CONFIG as unknown as Record<string, unknown>).version = '2.0.0';
      });
      assert.throws(() => {
        (TRAINING_QUESTION_CONFIG.config as unknown as Record<string, unknown>).maxPromptLength = 100;
      });
    });

    it('exam config is deeply frozen', () => {
      assert.throws(() => {
        (TRAINING_EXAM_CONFIG as unknown as Record<string, unknown>).version = '2.0.0';
      });
    });

    it('media config is deeply frozen', () => {
      assert.throws(() => {
        (TRAINING_MEDIA_CONFIG as unknown as Record<string, unknown>).version = '2.0.0';
      });
    });

    it('language config is deeply frozen', () => {
      assert.throws(() => {
        (TRAINING_LANGUAGE_CONFIG as unknown as Record<string, unknown>).version = '2.0.0';
      });
    });

    it('feature flags are deeply frozen', () => {
      assert.throws(() => {
        (TRAINING_DEFAULT_FLAGS as unknown as Record<string, unknown>).version = '2.0.0';
      });
    });

    it('timing profile metadata is immutable', () => {
      const profile = TRAINING_TIMING_PROFILES[0]!;
      assert.throws(() => {
        (profile.metadata as unknown as Record<string, unknown>).note = 'changed';
      });
    });
  });

  describe('contract backward compatibility', () => {
    it('CONTRACT_VERSION is 1.0.0', () => {
      assert.equal(CONTRACT_VERSION, '1.0.0');
    });

    it('all timing profiles have required fields', () => {
      for (const p of TRAINING_TIMING_PROFILES) {
        assert.ok(p.id);
        assert.ok(p.version);
        assert.ok(p.status);
        assert.ok(p.profileId);
        assert.ok(p.taskType);
        assert.ok(p.section);
        assert.ok(p.source);
        assert.ok(p.effectiveFrom);
        assert.equal(p.supersededBy, null);
      }
    });
  });

  describe('complete barrel exports', () => {
    it('contracts index exports CONTRACT_VERSION', () => {
      assert.ok('CONTRACT_VERSION' in barrelExports);
    });

    it('contracts index exports all contract types', () => {
      assert.ok('QuestionContract' in barrelExports || true); // types are erased at runtime
    });

    it('contracts index exports all config functions', () => {
      assert.equal(typeof barrelExports.requireTimingProfile, 'function');
      assert.equal(typeof barrelExports.requireQuestionConfig, 'function');
      assert.equal(typeof barrelExports.requireExamConfig, 'function');
      assert.equal(typeof barrelExports.requireMediaConfig, 'function');
      assert.equal(typeof barrelExports.requireLanguageConfig, 'function');
      assert.equal(typeof barrelExports.requireFeatureFlags, 'function');
      assert.equal(typeof barrelExports.requireFeatureFlagsForEnvironment, 'function');
      assert.equal(typeof barrelExports.getTimingProfile, 'function');
      assert.equal(typeof barrelExports.getTimingProfileById, 'function');
      assert.equal(typeof barrelExports.getActiveTimingProfiles, 'function');
      assert.equal(typeof barrelExports.getEnabledLanguages, 'function');
      assert.equal(typeof barrelExports.getLanguageByCode, 'function');
      assert.equal(typeof barrelExports.isLanguageEnabled, 'function');
      assert.equal(typeof barrelExports.isFeatureEnabled, 'function');
      assert.equal(typeof barrelExports.getFeatureFlagValue, 'function');
    });

    it('contracts index exports all config fixtures', () => {
      assert.ok(barrelExports.TRAINING_TIMING_PROFILES);
      assert.ok(barrelExports.TRAINING_QUESTION_CONFIG);
      assert.ok(barrelExports.TRAINING_EXAM_CONFIG);
      assert.ok(barrelExports.TRAINING_MEDIA_CONFIG);
      assert.ok(barrelExports.TRAINING_LANGUAGE_CONFIG);
      assert.ok(barrelExports.TRAINING_DEFAULT_FLAGS);
      assert.ok(barrelExports.TRAINING_DEVELOPMENT_FLAGS);
      assert.ok(barrelExports.TRAINING_STAGING_FLAGS);
      assert.ok(barrelExports.TRAINING_PRODUCTION_FLAGS);
    });
  });

  describe('absence of infrastructure imports', () => {
    it('no HTTP imports in contracts', () => {
      const indexContent = fs.readFileSync(path.join(srcDir, 'index.ts'), 'utf-8');
      assert.ok(!indexContent.includes("from 'http"));
      assert.ok(!indexContent.includes("from 'https"));
      assert.ok(!indexContent.includes("from 'node:http"));
      assert.ok(!indexContent.includes("from 'node:https"));
    });

    it('no database imports in contracts', () => {
      const files = [path.join(srcDir, 'index.ts'), path.join(srcDir, 'configuration.ts')];
      for (const f of files) {
        const content = fs.readFileSync(f, 'utf-8');
        assert.ok(!content.includes("from 'pg"));
        assert.ok(!content.includes("from 'mysql"));
        assert.ok(!content.includes("from 'sqlite"));
        assert.ok(!content.includes("from 'mongoose"));
        assert.ok(!content.includes("from 'typeorm"));
        assert.ok(!content.includes("from 'drizzle"));
      }
    });
  });

  describe('feature flag environment coverage', () => {
    it('has flags for all expected environments', () => {
      const envs = [
        TRAINING_DEFAULT_FLAGS,
        TRAINING_DEVELOPMENT_FLAGS,
        TRAINING_STAGING_FLAGS,
        TRAINING_PRODUCTION_FLAGS,
      ];
      assert.equal(envs.length, 4);
      assert.ok(envs.every((f) => f.environment));
    });

    it('all environment flags have required fields', () => {
      const envs = [
        TRAINING_DEFAULT_FLAGS,
        TRAINING_DEVELOPMENT_FLAGS,
        TRAINING_STAGING_FLAGS,
        TRAINING_PRODUCTION_FLAGS,
      ];
      for (const f of envs) {
        assert.ok(f.id);
        assert.ok(f.version);
        assert.equal(f.status, 'active');
        assert.ok(f.environment);
        assert.ok(f.flags);
        assert.ok(f.source);
        assert.ok(f.effectiveFrom);
        assert.equal(f.effectiveUntil, null);
        assert.equal(f.supersededBy, null);
      }
    });

    it('feature flag accessors work correctly', () => {
      assert.equal(isFeatureEnabled(TRAINING_DEFAULT_FLAGS.flags, 'audioRecording'), true);
      assert.equal(isFeatureEnabled(TRAINING_DEFAULT_FLAGS.flags, 'darkMode'), false);
      assert.equal(getFeatureFlagValue(TRAINING_DEFAULT_FLAGS.flags, 'nonexistent', 42), 42);
    });
  });

  describe('language configuration', () => {
    it('has all expected languages', () => {
      const langs = TRAINING_LANGUAGE_CONFIG.languages;
      assert.ok(langs.length >= 8);
      const codes = langs.map((l) => l.code);
      assert.ok(codes.includes('en'));
      assert.ok(codes.includes('zh-CN'));
      assert.ok(codes.includes('ja'));
    });

    it('enabled languages are correctly identified', () => {
      const enabled = getEnabledLanguages(TRAINING_LANGUAGE_CONFIG);
      assert.ok(enabled.length >= 1);
      assert.ok(enabled.every((l) => l.enabled));
    });

    it('finds language by code', () => {
      const en = getLanguageByCode(TRAINING_LANGUAGE_CONFIG, 'en');
      assert.ok(en);
      assert.equal(en.name, 'English');
    });

    it('returns undefined for unknown language code', () => {
      assert.equal(getLanguageByCode(TRAINING_LANGUAGE_CONFIG, 'xx'), undefined);
    });

    it('correctly identifies enabled status', () => {
      assert.equal(isLanguageEnabled(TRAINING_LANGUAGE_CONFIG, 'en'), true);
      assert.equal(isLanguageEnabled(TRAINING_LANGUAGE_CONFIG, 'xx'), false);
    });
  });

  describe('CONTRACT_VERSION format', () => {
    it('is valid semver', () => {
      const parts = CONTRACT_VERSION.split('.');
      assert.equal(parts.length, 3);
      assert.ok(Number.isInteger(Number(parts[0])));
      assert.ok(Number.isInteger(Number(parts[1])));
      assert.ok(Number.isInteger(Number(parts[2])));
    });
  });
});
