import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const SummarizeGroupDiscussionQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('summarize_group_discussion'),
  discussionAudioUrl: z.string().url().optional(),
  discussionTranscript: z.string(),
  maxWords: z.number().int().min(1),
  minWords: z.number().int().min(0),
});

export const SummarizeGroupDiscussionResponseSchema = z.object({
  recordingId: z.string(),
  writtenSummary: z.string().optional(),
});
