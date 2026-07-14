import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimingProfile,
  TIMING_PROFILES,
  SPEAKING_TIMING,
  getQuestionConfig,
  getExamConfig,
  getMediaConfig,
  SUPPORTED_LANGUAGES,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  getFeatureFlags,
  isFeatureEnabled,
  getFeatureFlagValue,
} from './config/index.js';

describe('config', () => {
  describe('timing', () => {
    it('has all section profiles', () => {
      assert.equal('speaking' in TIMING_PROFILES, true);
      assert.equal('writing' in TIMING_PROFILES, true);
      assert.equal('reading' in TIMING_PROFILES, true);
      assert.equal('listening' in TIMING_PROFILES, true);
    });

    it('returns correct profile', () => {
      const profile = getTimingProfile('speaking');
      assert.deepEqual(profile, SPEAKING_TIMING);
    });

    it('returns undefined for unknown section', () => {
      assert.equal(getTimingProfile('unknown'), undefined);
    });

    it('timing objects are frozen', () => {
      assert.throws(() => {
        (SPEAKING_TIMING as any).preparationSeconds = 999;
      });
    });
  });

  describe('metadata', () => {
    it('returns default question config', () => {
      const config = getQuestionConfig();
      assert.equal(config.maxPromptLength, 5000);
      assert.ok(config.supportedMediaTypes.length > 0);
    });

    it('returns default exam config', () => {
      const config = getExamConfig();
      assert.equal(config.maxTasks, 20);
      assert.equal(config.maxTimeMinutes, 180);
    });

    it('returns default media config', () => {
      const config = getMediaConfig();
      assert.ok(config.maxFileSizeBytes > 0);
      assert.ok(config.allowedMimeTypes.length > 0);
    });
  });

  describe('languages', () => {
    it('has supported languages', () => {
      assert.ok(SUPPORTED_LANGUAGES.length >= 4);
    });

    it('returns enabled languages', () => {
      const enabled = getEnabledLanguages();
      assert.ok(enabled.length >= 1);
      assert.ok(enabled.every((l) => l.enabled));
    });

    it('finds language by code', () => {
      const en = getLanguageByCode('en');
      assert.equal(en?.name, 'English');
    });

    it('returns undefined for unknown code', () => {
      assert.equal(getLanguageByCode('xx'), undefined);
    });

    it('checks language enabled', () => {
      assert.equal(isLanguageEnabled('en'), true);
      assert.equal(isLanguageEnabled('xx'), false);
    });
  });

  describe('features', () => {
    it('returns default flags', () => {
      const flags = getFeatureFlags();
      assert.equal(flags.darkMode, false);
      assert.equal(flags.audioRecording, true);
    });

    it('returns dev flags', () => {
      const flags = getFeatureFlags('development');
      assert.equal(flags.darkMode, true);
      assert.equal(flags.betaQuestions, true);
    });

    it('returns production flags', () => {
      const flags = getFeatureFlags('production');
      assert.equal(flags.darkMode, false);
    });

    it('checks feature enabled', () => {
      const flags = getFeatureFlags();
      assert.equal(isFeatureEnabled(flags, 'audioRecording'), true);
      assert.equal(isFeatureEnabled(flags, 'darkMode'), false);
    });

    it('gets flag value with default', () => {
      const flags = getFeatureFlags();
      assert.equal(getFeatureFlagValue(flags, 'nonexistent', 'fallback'), 'fallback');
      assert.equal(getFeatureFlagValue(flags, 'darkMode', true), false);
    });
  });
});
