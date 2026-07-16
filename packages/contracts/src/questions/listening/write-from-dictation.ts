import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Write from Dictation
 *
 * Candidate ID: write_from_dictation
 *
 * A short sentence is spoken. The candidate types exactly what they hear.
 * Correct answer is server-side only.
 */

export interface WriteFromDictationQuestion extends ListeningCommonContract {
  type: 'write_from_dictation';
  /** Total word count of the spoken sentence (informational). */
  wordCount: number;
}

export interface WriteFromDictationResponse {
  /** The candidate's typed transcription of the spoken sentence. */
  words: string;
}
