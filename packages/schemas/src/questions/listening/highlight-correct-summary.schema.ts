import { z } from 'zod';

export const HighlightCorrectSummaryOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const HighlightCorrectSummaryQuestionSchema = z.object({
  type: z.literal('highlight_correct_summary'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  options: z.array(HighlightCorrectSummaryOptionSchema).min(2),
});

export const HighlightCorrectSummaryResponseSchema = z.object({
  selectedKey: z.string().nullable(),
});
