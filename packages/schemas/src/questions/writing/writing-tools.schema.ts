import { z } from 'zod';

export const WritingToolsProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  minWordCoachingThreshold: z.number().int().min(0),
  maxWordCoachingThreshold: z.number().int().min(1),
  completionClassification: z.object({
    emptyThreshold: z.number().int().min(0),
    incompleteThreshold: z.number().int().min(0),
  }),
  normalisationPolicy: z.object({
    trimWhitespace: z.boolean(),
    normaliseUnicode: z.boolean(),
    collapseMultipleSpaces: z.boolean(),
  }),
  learningTools: z.object({
    wordCount: z.boolean(),
    spellCheck: z.boolean(),
    grammarCheck: z.boolean(),
    synonyms: z.boolean(),
    templates: z.boolean(),
  }),
  mockRestrictions: z.object({
    disableSpellCheck: z.boolean(),
    disableGrammarCheck: z.boolean(),
    disableSynonyms: z.boolean(),
    disableTemplates: z.boolean(),
    disableCoaching: z.boolean(),
  }),
});

export const WritingReviewDataSchema = z.object({
  wordCount: z.number().int().min(0),
  charCount: z.number().int().min(0),
  meetsMinimumWords: z.boolean(),
  exceedsMaximumWords: z.boolean(),
  spellingSuggestions: z
    .array(
      z.object({
        offset: z.number(),
        length: z.number(),
        original: z.string(),
        suggestions: z.array(z.string()),
      }),
    )
    .optional(),
  grammarSuggestions: z
    .array(
      z.object({
        offset: z.number(),
        length: z.number(),
        message: z.string(),
        severity: z.enum(['error', 'warning', 'info']),
      }),
    )
    .optional(),
});
