import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Summarise Spoken Text
 *
 * Candidate ID: summarise_spoken_text
 *
 * An audio passage is played once. The candidate writes a summary of the
 * spoken text. Word count limits are enforced.
 */

export interface SummariseSpokenTextQuestion extends ListeningCommonContract {
  type: 'summarise_spoken_text';
  /** Minimum word count for the summary. */
  minWords: number;
  /** Maximum word count for the summary. */
  maxWords: number;
}

export interface SummariseSpokenTextResponse {
  /** The candidate's summary text. */
  summary: string;
  /** Computed word count (informational, validated server-side). */
  wordCount: number;
}
