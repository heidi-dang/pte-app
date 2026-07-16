import { z } from 'zod';
import { QUESTION_SESSION_MODES } from '@pte-app/contracts';

export const SessionStateSchema = z.enum([
  'created',
  'active',
  'paused',
  'submitting',
  'submitted',
  'expired',
  'abandoned',
  'failed',
]);

export const QuestionSessionModeSchema = z.enum(QUESTION_SESSION_MODES);

export const QuestionSessionSchema = z.object({
  id: z.string(),
  mode: QuestionSessionModeSchema,
  state: SessionStateSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  pausedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
  expiredAt: z.string().datetime().optional(),
  abandonedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});
