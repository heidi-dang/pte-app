import { z } from 'zod';

export const PlaybackStateSchema = z.enum([
  'allowed',
  'ready',
  'started',
  'consumed',
  'completed',
  'failed-before-consumption',
  'failed-after-consumption',
]);

export const PlaybackRightSchema = z.object({
  id: z.string(),
  playbackProfileId: z.string(),
  allowedPlays: z.number().int(),
  consumedPlays: z.number().int(),
  state: PlaybackStateSchema,
  startedAt: z.string().datetime().optional(),
  consumedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  failureState: z.enum(['before-consumption', 'after-consumption']).optional(),
});
