import { z } from 'zod';

export const ActivityTypeSchema = z.enum([
  'attempt-completed',
  'scoring-completed',
  'evaluation-completed',
  'diagnostic-completed',
  'study-plan-updated',
  'mock-completed',
  'report-generated',
  'feedback-received',
]);

export const ActivityItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  activityType: ActivityTypeSchema,
  description: z.string().min(1),
  resultId: z.string().optional(),
  attemptId: z.string().optional(),
  questionVersionId: z.string().optional(),
  taskType: z.string().optional(),
  estimatedScore: z.number().optional(),
  classification: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});
