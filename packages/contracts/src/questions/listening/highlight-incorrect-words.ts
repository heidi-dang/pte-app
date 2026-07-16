import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Highlight Incorrect Words
 *
 * Candidate ID: highlight_incorrect_words
 *
 * An audio passage is played while a transcript is displayed. Some words
 * in the transcript do not match the audio. The candidate clicks/taps
 * each incorrect word to highlight it. Correct word indices are server-side only.
 */

export interface HighlightIncorrectWordsQuestion extends ListeningCommonContract {
  type: 'highlight_incorrect_words';
  /** The transcript as displayed to the candidate (may contain incorrect words). */
  transcript: string;
  /** Total number of words in the transcript (for validation). */
  wordCount: number;
  /** Number of incorrect words the candidate must find (informational). */
  incorrectWordCount: number;
}

export interface HighlightIncorrectWordsResponse {
  /** Zero-based indices of words the candidate highlighted as incorrect. */
  flaggedWordIndices: number[];
}
