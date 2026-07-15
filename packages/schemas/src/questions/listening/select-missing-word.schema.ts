import { z } from 'zod';

export const SelectMissingWordOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const SelectMissingWordQuestionSchema = z.object({
  type: z.literal('select_missing_word'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  transcript: z.string().min(1),
  options: z.array(SelectMissingWordOptionSchema).min(2),
});

export const SelectMissingWordResponseSchema = z.object({
  selectedKey: z.string().nullable(),
});
