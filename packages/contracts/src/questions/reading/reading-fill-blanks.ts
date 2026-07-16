import type { ReadingCommonContract, ReadingPassage } from './common.js';

/**
 * Reading: Fill in the Blanks
 *
 * Candidate ID: reading_fill_blanks
 *
 * A passage with gaps. Unlike R&W Fill Blanks, the candidate drags
 * word-box tokens from a word bank into each gap. Each token can only
 * be used once. Correct placements are server-side only.
 */

export interface ReadingFillBlankToken {
  /** Stable unique key for this token (e.g. "tok_0", "tok_1"). */
  id: string;
  /** Display text of the word/phrase token. */
  text: string;
}

export interface ReadingFillBlankGap {
  /** Zero-based gap index; matches {GAP:N} placeholder in passage text. */
  index: number;
}

export interface ReadingFillBlanksQuestion extends ReadingCommonContract {
  type: 'reading_fill_blanks';
  passage: ReadingPassage;
  /** Available word tokens in the word bank (shuffled, more than gap count). */
  tokens: ReadingFillBlankToken[];
  /** Gap descriptors in display order. */
  gaps: ReadingFillBlankGap[];
}

export interface ReadingFillBlanksResponse {
  /**
   * Map from gap index (string key) to token ID placed in that gap.
   * A gap with no token placed has no entry (or maps to null).
   */
  placements: Record<string, string | null>;
}
