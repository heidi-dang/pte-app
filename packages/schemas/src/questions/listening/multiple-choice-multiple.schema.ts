import { z } from 'zod';

export const ListeningMcqOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const ListeningMultipleAnswersQuestionSchema = z.object({
  type: z.literal('listening_multiple_answers'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  questionStem: z.string().min(1),
  options: z.array(ListeningMcqOptionSchema).min(2),
  minSelections: z.number().int().min(1),
  maxSelections: z.number().int().min(1),
});

export const ListeningMultipleAnswersResponseSchema = z.object({
  selectedKeys: z.array(z.string()),
});
