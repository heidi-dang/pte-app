import { z } from 'zod';
import { ReadingPassageSchema } from './common.schema.js';

export const SingleMcqOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const ReadingMultipleChoiceSingleQuestionSchema = z.object({
  type: z.literal('reading_single_answer'),
  instructions: z.string().min(1),
  passage: ReadingPassageSchema,
  questionStem: z.string().min(1),
  options: z.array(SingleMcqOptionSchema).min(2),
});

export const ReadingMultipleChoiceSingleResponseSchema = z.object({
  selectedKey: z.string().nullable(),
});
