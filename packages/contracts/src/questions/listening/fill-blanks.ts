import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Fill in the Blanks
 *
 * Candidate ID: listening_fill_blanks
 *
 * An audio passage is played with a transcript displayed. Some words are
 * replaced by blanks. The candidate types the missing word for each blank.
 * Correct answers are server-side only.
 */

export interface ListeningFillBlankGap {
  /** Zero-based gap index; matches the blank position in the transcript. */
  index: number;
  /** The word that appears before the gap (context hint, optional). */
  precedingWord?: string;
  /** The word that appears after the gap (context hint, optional). */
  followingWord?: string;
}

export interface ListeningFillBlanksQuestion extends ListeningCommonContract {
  type: 'listening_fill_blanks';
  /** The transcript with {GAP:0}, {GAP:1}, … placeholders. */
  transcript: string;
  /** Gap descriptors in display order. */
  gaps: ListeningFillBlankGap[];
}

export interface ListeningFillBlanksResponse {
  /**
   * Map from gap index (string key) to the candidate's typed word.
   * A gap with no input has no entry (or maps to null).
   */
  placements: Record<string, string | null>;
}
