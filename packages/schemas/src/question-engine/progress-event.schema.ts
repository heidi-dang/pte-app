import { z } from 'zod';

export const QuestionProgressEventTypeSchema = z.enum([
  'session.created',
  'session.started',
  'session.paused',
  'session.resumed',
  'session.recovered',
  'response.save-started',
  'response.saved',
  'response.save-failed',
  'timer.warning',
  'timer.expired',
  'playback.ready',
  'playback.started',
  'playback.consumed',
  'playback.completed',
  'playback.failed',
  'submission.started',
  'submission.completed',
  'submission.failed',
  'session.abandoned',
]);

export const QuestionSessionEventSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sequence: z.number().int().nonnegative(),
  type: QuestionProgressEventTypeSchema,
  payload: z.unknown(),
  occurredAt: z.string().datetime(),
  actorId: z.string().optional(),
});
