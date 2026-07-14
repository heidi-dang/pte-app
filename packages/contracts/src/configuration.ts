import type {
  ConfigurationId,
  Version,
  ConfigurationStatus,
  ISO8601DateTime,
  ISO8601Date,
  JsonObject,
} from '@pte-app/types';

export interface VersionedConfiguration<T extends JsonObject = JsonObject> {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly key: string;
  readonly value: T;
  readonly scope: ConfigurationScope;
  readonly environment: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly source: string;
  readonly supersededBy: ConfigurationId | null;
  readonly migrationCompatibility: string | null;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export type ConfigurationScope = 'global' | 'exam' | 'question' | 'user' | 'feature';

export interface TimingProfileConfig {
  readonly preparationSeconds: number;
  readonly responseSeconds: number;
  readonly reviewSeconds: number;
}

export interface VersionedTimingProfile {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly profileId: string;
  readonly taskType: string;
  readonly section: string;
  readonly preparationSeconds: number;
  readonly responseSeconds: number;
  readonly reviewSeconds: number;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
  readonly metadata: JsonObject;
}

export interface QuestionMetadataConfig {
  readonly maxPromptLength: number;
  readonly supportedMediaTypes: ReadonlyArray<string>;
  readonly scoringCriteria: ReadonlyArray<string>;
}

export interface ExamMetadataConfig {
  readonly maxTasks: number;
  readonly maxTimeMinutes: number;
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

export interface VersionedFeatureFlags {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly environment: string;
  readonly flags: FeatureFlags;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
}

export interface VersionedLanguageConfig {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly languages: ReadonlyArray<LanguageMetadataConfig>;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
}

export interface VersionedQuestionMetadataConfig {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly config: QuestionMetadataConfig;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
}

export interface VersionedExamMetadataConfig {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly config: ExamMetadataConfig;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
}

export interface VersionedMediaMetadataConfig {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: ConfigurationStatus;
  readonly config: MediaMetadataConfig;
  readonly source: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly supersededBy: ConfigurationId | null;
}
