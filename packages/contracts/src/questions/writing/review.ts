/**
 * Writing review data — separate from active-attempt payloads.
 */
export interface WritingReviewData {
  /** Normalised word count. */
  wordCount: number;
  /** Character count. */
  charCount: number;
  /** Whether the response meets minimum word requirement. */
  meetsMinimumWords: boolean;
  /** Whether the response exceeds maximum word requirement. */
  exceedsMaximumWords: boolean;
  /** Spelling suggestions (learning mode only). */
  spellingSuggestions?: SpellingSuggestion[];
  /** Grammar suggestions (learning mode only). */
  grammarSuggestions?: GrammarSuggestion[];
}

export interface SpellingSuggestion {
  offset: number;
  length: number;
  original: string;
  suggestions: string[];
}

export interface GrammarSuggestion {
  offset: number;
  length: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
