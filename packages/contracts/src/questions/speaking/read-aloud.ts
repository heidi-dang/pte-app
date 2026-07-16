import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Read Aloud
 *
 * Candidate reads a displayed passage aloud.
 */
export interface ReadAloudQuestion extends SpeakingCommonContract {
  type: 'read_aloud';
  /** The passage text to read. */
  passage: { text: string; wordCount: number };
  /** Whether the text remains visible during recording. */
  showText: boolean;
}

export interface ReadAloudResponse {
  recordingId: string;
}
