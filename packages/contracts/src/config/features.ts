import type { ConfigurationId, Version, ConfigurationStatus, ISO8601Date } from '@pte-app/types';
import type { VersionedFeatureFlags, FeatureFlags } from '../configuration.js';

const TRAINING_SOURCE = 'estimated-training-configuration';

export const TRAINING_DEFAULT_FLAGS: VersionedFeatureFlags = Object.freeze({
  id: 'cfg-features-default' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  environment: 'default',
  flags: Object.freeze({
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
  } as FeatureFlags),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

export const TRAINING_DEVELOPMENT_FLAGS: VersionedFeatureFlags = Object.freeze({
  id: 'cfg-features-development' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  environment: 'development',
  flags: Object.freeze({
    darkMode: true,
    betaQuestions: true,
    audioRecording: true,
    writingReview: true,
    aiScoring: true,
    progressTracking: true,
    contentVersioning: true,
    auditLogging: true,
    exportResults: true,
    mobileMode: false,
  } as FeatureFlags),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

export const TRAINING_STAGING_FLAGS: VersionedFeatureFlags = Object.freeze({
  id: 'cfg-features-staging' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  environment: 'staging',
  flags: Object.freeze({
    darkMode: true,
    betaQuestions: true,
    audioRecording: true,
    writingReview: true,
    aiScoring: false,
    progressTracking: true,
    contentVersioning: true,
    auditLogging: true,
    exportResults: true,
    mobileMode: false,
  } as FeatureFlags),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

export const TRAINING_PRODUCTION_FLAGS: VersionedFeatureFlags = Object.freeze({
  id: 'cfg-features-production' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  environment: 'production',
  flags: Object.freeze({
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
  } as FeatureFlags),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

const ALL_ENV_FLAGS: ReadonlyArray<VersionedFeatureFlags> = [
  TRAINING_DEFAULT_FLAGS,
  TRAINING_DEVELOPMENT_FLAGS,
  TRAINING_STAGING_FLAGS,
  TRAINING_PRODUCTION_FLAGS,
];

const FLAG_INDEX = new Map<string, VersionedFeatureFlags>(ALL_ENV_FLAGS.map((f) => [f.environment, f] as const));

const FLAG_ID_INDEX = new Map<ConfigurationId, VersionedFeatureFlags>(ALL_ENV_FLAGS.map((f) => [f.id, f] as const));

export function getFeatureFlagsById(configId: ConfigurationId): VersionedFeatureFlags | undefined {
  return FLAG_ID_INDEX.get(configId);
}

export function requireFeatureFlags(configId: ConfigurationId): VersionedFeatureFlags {
  const config = FLAG_ID_INDEX.get(configId);
  if (config === undefined) {
    throw new Error(`Unknown feature flag configuration: ${configId}`);
  }
  return config;
}

export function getFeatureFlagsForEnvironment(environment: string): VersionedFeatureFlags | undefined {
  return FLAG_INDEX.get(environment);
}

export function requireFeatureFlagsForEnvironment(environment: string): VersionedFeatureFlags {
  const config = FLAG_INDEX.get(environment);
  if (config === undefined) {
    throw new Error(`No feature flag configuration for environment: ${environment}`);
  }
  return config;
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
