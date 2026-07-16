import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const SummarizeGroupDiscussionQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('summarize_group_discussion'),
  discussionAudioUrl: z.string().url().optional(),
  discussionTranscript: z.string(),
  maxWords: z.number().int().min(1),
  minWords: z.number().int().min(0),
}).superRefine((data, ctx) => {
  if (data.minWords > data.maxWords) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minWords cannot exceed maxWords',
      path: ['minWords'],
    });
  }
});

export const SummarizeGroupDiscussionResponseSchema = z.object({
  recordingId: z
    .string()
    .min(1)
    .refine((s) => s.trim() === s, {
      message: 'Recording ID must not be whitespace-only',
    }),
  writtenSummary: z
    .string()
    .optional()
    .refine((s) => s === undefined || s.trim().length > 0, {
      message: 'Written summary must not be whitespace-only if provided',
    }),
});
