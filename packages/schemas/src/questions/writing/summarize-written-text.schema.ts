import { z } from 'zod';
import { WritingCommonSchema } from './common.schema.js';

export const SummarizeWrittenTextQuestionSchema = WritingCommonSchema.extend({
  type: z.literal('summarize_written_text'),
  passage: z.string().min(1),
});

export const SummarizeWrittenTextResponseSchema = z.object({
  text: z.string(),
});
