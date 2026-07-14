import { z } from 'zod';

export const ConfigurationScopeSchema = z.enum(['global', 'exam', 'question', 'user', 'feature']);
export const ConfigurationStatusSchema = z.enum(['active', 'deprecated', 'superseded', 'draft']);

export const VersionedConfigurationSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  key: z.string().min(1),
  value: z.record(z.unknown()),
  scope: ConfigurationScopeSchema,
  environment: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  source: z.string().min(1),
  supersededBy: z.string().nullable(),
  migrationCompatibility: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimingProfileConfigSchema = z.object({
  preparationSeconds: z.number().int().min(0),
  responseSeconds: z.number().int().min(1),
  reviewSeconds: z.number().int().min(0),
});

export const VersionedTimingProfileSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  profileId: z.string().min(1),
  taskType: z.string().min(1),
  section: z.string().min(1),
  preparationSeconds: z.number().int().min(0),
  responseSeconds: z.number().int().min(1),
  reviewSeconds: z.number().int().min(0),
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
  metadata: z.record(z.unknown()),
});

export const QuestionMetadataConfigSchema = z.object({
  maxPromptLength: z.number().int().min(1),
  supportedMediaTypes: z.array(z.string().min(1)),
  scoringCriteria: z.array(z.string().min(1)),
});

export const ExamMetadataConfigSchema = z.object({
  maxTasks: z.number().int().min(1),
  maxTimeMinutes: z.number().int().min(1),
});

export const MediaMetadataConfigSchema = z.object({
  maxFileSizeBytes: z.number().int().min(1),
  allowedMimeTypes: z.array(z.string().min(1)),
  maxDurationSeconds: z.number().int().min(0),
});

export const LanguageMetadataConfigSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  enabled: z.boolean(),
});

export const FeatureFlagsSchema = z.record(z.union([z.boolean(), z.string(), z.number()]));

export const VersionedFeatureFlagsSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  environment: z.string().min(1),
  flags: FeatureFlagsSchema,
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
});

export const VersionedLanguageConfigSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  languages: z.array(LanguageMetadataConfigSchema),
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
});

export const VersionedQuestionMetadataConfigSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  config: QuestionMetadataConfigSchema,
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
});

export const VersionedExamMetadataConfigSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  config: ExamMetadataConfigSchema,
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
});

export const VersionedMediaMetadataConfigSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  status: ConfigurationStatusSchema,
  config: MediaMetadataConfigSchema,
  source: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().nullable(),
  supersededBy: z.string().nullable(),
});
