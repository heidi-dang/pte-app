import type { FeatureFlags } from '../configuration.js';

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.freeze({
  darkMode: false,
  betaQuestions: false,
  audioRecording: true,
  writingReview: true,
  aiScoring: false,
  progressTracking: true,
  contentVersioning: true,
  auditLogging: true,
  exportResults: false,
  mobileMode: false,
}) as FeatureFlags;

export const FEATURE_FLAGS_BY_ENVIRONMENT: Record<string, FeatureFlags> = Object.freeze({
  development: Object.freeze({
    ...DEFAULT_FEATURE_FLAGS,
    darkMode: true,
    betaQuestions: true,
    aiScoring: true,
    exportResults: true,
  }) as FeatureFlags,
  staging: Object.freeze({
    ...DEFAULT_FEATURE_FLAGS,
    darkMode: true,
    betaQuestions: true,
    aiScoring: false,
    exportResults: true,
  }) as FeatureFlags,
  production: Object.freeze({
    ...DEFAULT_FEATURE_FLAGS,
  }) as FeatureFlags,
});

export function getFeatureFlags(environment?: string): FeatureFlags {
  if (environment && FEATURE_FLAGS_BY_ENVIRONMENT[environment]) {
    return FEATURE_FLAGS_BY_ENVIRONMENT[environment] ?? DEFAULT_FEATURE_FLAGS;
  }
  return DEFAULT_FEATURE_FLAGS;
}

export function isFeatureEnabled(flags: FeatureFlags, key: string): boolean {
  const value = flags[key];
  return value === true || value === 'true';
}

export function getFeatureFlagValue<T extends boolean | string | number>(
  flags: FeatureFlags,
  key: string,
  defaultValue: T,
): T {
  const value = flags[key];
  if (value === undefined || value === null) return defaultValue;
  return value as T;
}
