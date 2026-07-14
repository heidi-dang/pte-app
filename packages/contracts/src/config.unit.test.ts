import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimingProfile,
  getTimingProfileById,
  getActiveTimingProfiles,
  requireTimingProfile,
  TRAINING_TIMING_PROFILES,
  TRAINING_QUESTION_CONFIG,
  TRAINING_EXAM_CONFIG,
  TRAINING_MEDIA_CONFIG,
  requireQuestionConfig,
  requireExamConfig,
  requireMediaConfig,
  getActiveQuestionConfig,
  getActiveExamConfig,
  getActiveMediaConfig,
  TRAINING_LANGUAGE_CONFIG,
  getActiveLanguageConfig,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  requireLanguageConfig,
  TRAINING_DEFAULT_FLAGS,
  TRAINING_DEVELOPMENT_FLAGS,
  TRAINING_PRODUCTION_FLAGS,
  requireFeatureFlags,
  requireFeatureFlagsForEnvironment,
  isFeatureEnabled,
  getFeatureFlagValue,
} from './config/index.js';
import type { ConfigurationId } from '@pte-app/types';

describe('config', () => {
  describe('timing', () => {
    it('has all training timing profiles', () => {
      assert.ok(TRAINING_TIMING_PROFILES.length >= 4);
    });

    it('returns profile by section and taskType', () => {
      const profile = getTimingProfile('speaking', 'read-aloud');
      assert.ok(profile);
      assert.equal(profile.section, 'speaking');
      assert.equal(profile.taskType, 'read-aloud');
    });

    it('returns undefined for unknown section and taskType', () => {
      assert.equal(getTimingProfile('unknown', 'unknown'), undefined);
    });

    it('returns profile by id', () => {
      const profile = getTimingProfileById(TRAINING_TIMING_PROFILES[0]!.id);
      assert.ok(profile);
      assert.equal(profile.id, TRAINING_TIMING_PROFILES[0]!.id);
    });

    it('throws for unknown profile id', () => {
      assert.throws(() => {
        requireTimingProfile('nonexistent' as ConfigurationId, 'task');
      }, /No timing profile found/);
    });

    it('gets active profiles', () => {
      const active = getActiveTimingProfiles();
      assert.ok(active.length >= 4);
    });

    it('timing profiles are deeply frozen', () => {
      const profile = TRAINING_TIMING_PROFILES[0]!;
      assert.throws(() => {
        (profile as any).preparationSeconds = 999;
      });
      assert.throws(() => {
        (profile.metadata as any).note = 'changed';
      });
    });
  });

  describe('metadata', () => {
    it('returns active question config', () => {
      const config = getActiveQuestionConfig();
      assert.equal(config.config.maxPromptLength, 5000);
      assert.ok(config.config.supportedMediaTypes.length > 0);
      assert.equal(config.status, 'active');
    });

    it('returns active exam config', () => {
      const config = getActiveExamConfig();
      assert.equal(config.config.maxTasks, 20);
      assert.equal(config.config.maxTimeMinutes, 180);
      assert.equal(config.status, 'active');
    });

    it('returns active media config', () => {
      const config = getActiveMediaConfig();
      assert.ok(config.config.maxFileSizeBytes > 0);
      assert.ok(config.config.allowedMimeTypes.length > 0);
      assert.equal(config.status, 'active');
    });

    it('throws for unknown question config', () => {
      assert.throws(() => {
        requireQuestionConfig('unknown' as ConfigurationId);
      }, /Unknown question configuration/);
    });

    it('throws for unknown exam config', () => {
      assert.throws(() => {
        requireExamConfig('unknown' as ConfigurationId);
      }, /Unknown exam configuration/);
    });

    it('throws for unknown media config', () => {
      assert.throws(() => {
        requireMediaConfig('unknown' as ConfigurationId);
      }, /Unknown media configuration/);
    });
  });

  describe('languages', () => {
    it('has language config', () => {
      const config = getActiveLanguageConfig();
      assert.ok(config.languages.length >= 4);
    });

    it('returns enabled languages', () => {
      const config = getActiveLanguageConfig();
      const enabled = getEnabledLanguages(config);
      assert.ok(enabled.length >= 1);
      assert.ok(enabled.every((l) => l.enabled));
    });

    it('finds language by code', () => {
      const config = getActiveLanguageConfig();
      const en = getLanguageByCode(config, 'en');
      assert.equal(en?.name, 'English');
    });

    it('returns undefined for unknown code', () => {
      const config = getActiveLanguageConfig();
      assert.equal(getLanguageByCode(config, 'xx'), undefined);
    });

    it('checks language enabled', () => {
      const config = getActiveLanguageConfig();
      assert.equal(isLanguageEnabled(config, 'en'), true);
      assert.equal(isLanguageEnabled(config, 'xx'), false);
    });

    it('throws for unknown language config', () => {
      assert.throws(() => {
        requireLanguageConfig('unknown' as ConfigurationId);
      }, /Unknown language configuration/);
    });
  });

  describe('features', () => {
    it('returns default flags', () => {
      const config = TRAINING_DEFAULT_FLAGS;
      assert.equal(config.flags.darkMode, false);
      assert.equal(config.flags.audioRecording, true);
      assert.equal(config.status, 'active');
    });

    it('returns dev flags', () => {
      const config = TRAINING_DEVELOPMENT_FLAGS;
      assert.equal(config.flags.darkMode, true);
      assert.equal(config.flags.betaQuestions, true);
    });

    it('returns production flags', () => {
      const config = TRAINING_PRODUCTION_FLAGS;
      assert.equal(config.flags.darkMode, false);
    });

    it('throws for unknown feature flag config', () => {
      assert.throws(() => {
        requireFeatureFlags('unknown' as ConfigurationId);
      }, /Unknown feature flag configuration/);
    });

    it('throws for unknown environment', () => {
      assert.throws(() => {
        requireFeatureFlagsForEnvironment('nonexistent');
      }, /No feature flag configuration for environment/);
    });

    it('checks feature enabled', () => {
      assert.equal(isFeatureEnabled(TRAINING_DEFAULT_FLAGS.flags, 'audioRecording'), true);
      assert.equal(isFeatureEnabled(TRAINING_DEFAULT_FLAGS.flags, 'darkMode'), false);
    });

    it('gets flag value with default', () => {
      assert.equal(getFeatureFlagValue(TRAINING_DEFAULT_FLAGS.flags, 'nonexistent', 'fallback'), 'fallback');
      assert.equal(getFeatureFlagValue(TRAINING_DEFAULT_FLAGS.flags, 'darkMode', true), false);
    });
  });
});
