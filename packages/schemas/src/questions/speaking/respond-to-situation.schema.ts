import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const RespondToSituationQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('respond_to_situation'),
  situationDescription: z.string(),
  promptText: z.string(),
});

export const RespondToSituationResponseSchema = z.object({
  recordingId: z.string(),
});
