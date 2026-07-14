import type { ConfigurationId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface ConfigurationContract {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly key: string;
  readonly value: JsonObject;
  readonly scope: ConfigurationScope;
  readonly environment: string;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export type ConfigurationScope = 'global' | 'exam' | 'question' | 'user' | 'feature';

export interface TimingProfile {
  readonly preparationSeconds: number;
  readonly responseSeconds: number;
  readonly reviewSeconds: number;
}

export interface QuestionMetadataConfig {
  readonly maxPromptLength: number;
  readonly supportedMediaTypes: ReadonlyArray<string>;
  readonly scoringCriteria: ReadonlyArray<string>;
}

export interface ExamMetadataConfig {
  readonly maxTasks: number;
  readonly maxTimeMinutes: number;
  readonly passingScorePercentage: number;
}

export interface MediaMetadataConfig {
  readonly maxFileSizeBytes: number;
  readonly allowedMimeTypes: ReadonlyArray<string>;
  readonly maxDurationSeconds: number;
}

export interface LanguageMetadataConfig {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly enabled: boolean;
}

export interface FeatureFlags {
  readonly [key: string]: boolean | string | number;
}
