import { z } from 'zod';

export const ConfigurationScopeSchema = z.enum(['global', 'exam', 'question', 'user', 'feature']);

export const ConfigurationContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  key: z.string().min(1),
  value: z.record(z.unknown()),
  scope: ConfigurationScopeSchema,
  environment: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimingProfileSchema = z.object({
  preparationSeconds: z.number().int().min(0),
  responseSeconds: z.number().int().min(1),
  reviewSeconds: z.number().int().min(0),
});

export const QuestionMetadataConfigSchema = z.object({
  maxPromptLength: z.number().int().min(1),
  supportedMediaTypes: z.array(z.string().min(1)).readonly(),
  scoringCriteria: z.array(z.string().min(1)).readonly(),
});

export const ExamMetadataConfigSchema = z.object({
  maxTasks: z.number().int().min(1),
  maxTimeMinutes: z.number().int().min(1),
  passingScorePercentage: z.number().min(0).max(100),
});

export const MediaMetadataConfigSchema = z.object({
  maxFileSizeBytes: z.number().int().min(1),
  allowedMimeTypes: z.array(z.string().min(1)).readonly(),
  maxDurationSeconds: z.number().int().min(0),
});

export const LanguageMetadataConfigSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  enabled: z.boolean(),
});

export const FeatureFlagsSchema = z.record(z.union([z.boolean(), z.string(), z.number()]));
