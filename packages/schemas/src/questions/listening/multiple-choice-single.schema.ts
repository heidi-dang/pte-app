import { z } from 'zod';

export const ListeningSingleMcqOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const ListeningSingleAnswerQuestionSchema = z.object({
  type: z.literal('listening_single_answer'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  questionStem: z.string().min(1),
  options: z.array(ListeningSingleMcqOptionSchema).min(2),
});

export const ListeningSingleAnswerResponseSchema = z.object({
  selectedKey: z.string().nullable(),
});
