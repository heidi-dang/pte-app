import { z } from 'zod';
import { ReadingPassageSchema } from './common.schema.js';

export const McqOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const ReadingMultipleChoiceMultipleQuestionSchema = z.object({
  type: z.literal('reading_multiple_answers'),
  instructions: z.string().min(1),
  passage: ReadingPassageSchema,
  questionStem: z.string().min(1),
  options: z.array(McqOptionSchema).min(2),
  minSelections: z.number().int().min(1),
  maxSelections: z.number().int().min(1),
});

export const ReadingMultipleChoiceMultipleResponseSchema = z.object({
  selectedKeys: z.array(z.string()),
});
