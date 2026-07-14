import type { ConfigurationId, Version, ConfigurationStatus, ISO8601Date } from '@pte-app/types';
import type {
  VersionedQuestionMetadataConfig,
  VersionedExamMetadataConfig,
  VersionedMediaMetadataConfig,
  QuestionMetadataConfig,
  ExamMetadataConfig,
  MediaMetadataConfig,
} from '../configuration.js';

const TRAINING_SOURCE = 'estimated-training-configuration';

export const TRAINING_QUESTION_CONFIG: VersionedQuestionMetadataConfig = Object.freeze({
  id: 'cfg-question-metadata-default' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  config: Object.freeze({
    maxPromptLength: 5000,
    supportedMediaTypes: Object.freeze(['audio', 'video', 'image', 'document']) as ReadonlyArray<string>,
    scoringCriteria: Object.freeze([
      'content',
      'grammar',
      'vocabulary',
      'pronunciation',
      'fluency',
      'coherence',
    ]) as ReadonlyArray<string>,
  } as QuestionMetadataConfig),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

export const TRAINING_EXAM_CONFIG: VersionedExamMetadataConfig = Object.freeze({
  id: 'cfg-exam-metadata-default' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  config: Object.freeze({
    maxTasks: 20,
    maxTimeMinutes: 180,
  } as ExamMetadataConfig),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

export const TRAINING_MEDIA_CONFIG: VersionedMediaMetadataConfig = Object.freeze({
  id: 'cfg-media-metadata-default' as ConfigurationId,
  version: '1.0.0' as Version,
  status: 'active' as ConfigurationStatus,
  config: Object.freeze({
    maxFileSizeBytes: 104_857_600,
    allowedMimeTypes: Object.freeze([
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'image/png',
      'image/jpeg',
      'image/gif',
      'application/pdf',
    ]) as ReadonlyArray<string>,
    maxDurationSeconds: 600,
  } as MediaMetadataConfig),
  source: TRAINING_SOURCE,
  effectiveFrom: '2026-01-01' as ISO8601Date,
  effectiveUntil: null,
  supersededBy: null,
});

const QUESTION_CONFIGS = new Map<ConfigurationId, VersionedQuestionMetadataConfig>([
  [TRAINING_QUESTION_CONFIG.id, TRAINING_QUESTION_CONFIG],
]);

const EXAM_CONFIGS = new Map<ConfigurationId, VersionedExamMetadataConfig>([
  [TRAINING_EXAM_CONFIG.id, TRAINING_EXAM_CONFIG],
]);

const MEDIA_CONFIGS = new Map<ConfigurationId, VersionedMediaMetadataConfig>([
  [TRAINING_MEDIA_CONFIG.id, TRAINING_MEDIA_CONFIG],
]);

export function getQuestionConfigById(configId: ConfigurationId): VersionedQuestionMetadataConfig | undefined {
  return QUESTION_CONFIGS.get(configId);
}

export function requireQuestionConfig(configId: ConfigurationId): VersionedQuestionMetadataConfig {
  const config = QUESTION_CONFIGS.get(configId);
  if (config === undefined) {
    throw new Error(`Unknown question configuration: ${configId}`);
  }
  return config;
}

export function getExamConfigById(configId: ConfigurationId): VersionedExamMetadataConfig | undefined {
  return EXAM_CONFIGS.get(configId);
}

export function requireExamConfig(configId: ConfigurationId): VersionedExamMetadataConfig {
  const config = EXAM_CONFIGS.get(configId);
  if (config === undefined) {
    throw new Error(`Unknown exam configuration: ${configId}`);
  }
  return config;
}

export function getMediaConfigById(configId: ConfigurationId): VersionedMediaMetadataConfig | undefined {
  return MEDIA_CONFIGS.get(configId);
}

export function requireMediaConfig(configId: ConfigurationId): VersionedMediaMetadataConfig {
  const config = MEDIA_CONFIGS.get(configId);
  if (config === undefined) {
    throw new Error(`Unknown media configuration: ${configId}`);
  }
  return config;
}

export function getActiveQuestionConfig(): VersionedQuestionMetadataConfig {
  return TRAINING_QUESTION_CONFIG;
}

export function getActiveExamConfig(): VersionedExamMetadataConfig {
  return TRAINING_EXAM_CONFIG;
}

export function getActiveMediaConfig(): VersionedMediaMetadataConfig {
  return TRAINING_MEDIA_CONFIG;
}
