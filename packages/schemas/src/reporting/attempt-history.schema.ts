import { z } from 'zod';

export const AttemptHistoryFilterSchema = z.object({
  taskTypes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
  mode: z.string().optional(),
  resultState: z.enum(['any', 'completed', 'partial', 'failed']).optional(),
  limit: z.number().int().min(1).max(1000),
  offset: z.number().int().min(0),
});

export const AttemptHistoryEntrySchema = z.object({
  attemptId: z.string(),
  questionVersionId: z.string(),
  taskType: z.string(),
  section: z.string(),
  mode: z.string(),
  submittedAt: z.string(),
  estimatedScore: z.number(),
  classification: z.string(),
  resultState: z.string(),
  responseAvailable: z.boolean(),
  mediaAvailable: z.boolean(),
  feedbackAvailable: z.boolean(),
  scoringProfileVersion: z.number().int(),
});

export const AttemptHistoryResultSchema = z.object({
  entries: z.array(AttemptHistoryEntrySchema),
  total: z.number().int().min(0),
  limit: z.number().int(),
  offset: z.number().int(),
});
