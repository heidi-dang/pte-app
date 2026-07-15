import { z } from 'zod';
import { WritingCommonSchema } from './common.schema.js';

export const WriteEssayQuestionSchema = WritingCommonSchema.extend({
  type: z.literal('write_essay'),
  prompt: z.string().min(1),
  discussionText: z.string().optional(),
});

export const WriteEssayResponseSchema = z.object({
  text: z.string(),
});
