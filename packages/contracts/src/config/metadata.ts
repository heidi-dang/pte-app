import type { QuestionMetadataConfig, ExamMetadataConfig, MediaMetadataConfig } from '../configuration.js';

export const DEFAULT_QUESTION_CONFIG: QuestionMetadataConfig = Object.freeze({
  maxPromptLength: 5000,
  supportedMediaTypes: Object.freeze(['audio', 'video', 'image', 'document']) as unknown as ReadonlyArray<string>,
  scoringCriteria: Object.freeze([
    'content',
    'grammar',
    'vocabulary',
    'pronunciation',
    'fluency',
    'coherence',
  ]) as unknown as ReadonlyArray<string>,
});

export const DEFAULT_EXAM_CONFIG: ExamMetadataConfig = Object.freeze({
  maxTasks: 20,
  maxTimeMinutes: 180,
  passingScorePercentage: 65,
});

export const DEFAULT_MEDIA_CONFIG: MediaMetadataConfig = Object.freeze({
  maxFileSizeBytes: 100 * 1024 * 1024,
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
  ]) as unknown as ReadonlyArray<string>,
  maxDurationSeconds: 600,
});

export const QUESTION_CONFIGS: Record<string, QuestionMetadataConfig> = Object.freeze({
  default: DEFAULT_QUESTION_CONFIG,
});

export const EXAM_CONFIGS: Record<string, ExamMetadataConfig> = Object.freeze({
  default: DEFAULT_EXAM_CONFIG,
});

export const MEDIA_CONFIGS: Record<string, MediaMetadataConfig> = Object.freeze({
  default: DEFAULT_MEDIA_CONFIG,
});

export function getQuestionConfig(profile?: string): QuestionMetadataConfig {
  return QUESTION_CONFIGS[profile ?? 'default'] ?? DEFAULT_QUESTION_CONFIG;
}

export function getExamConfig(profile?: string): ExamMetadataConfig {
  return EXAM_CONFIGS[profile ?? 'default'] ?? DEFAULT_EXAM_CONFIG;
}

export function getMediaConfig(profile?: string): MediaMetadataConfig {
  return MEDIA_CONFIGS[profile ?? 'default'] ?? DEFAULT_MEDIA_CONFIG;
}
