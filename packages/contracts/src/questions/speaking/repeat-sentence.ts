import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Repeat Sentence
 *
 * Candidate listens to a sentence and repeats it.
 */
export interface RepeatSentenceQuestion extends SpeakingCommonContract {
  type: 'repeat_sentence';
  /** Duration of the audio in milliseconds. */
  audioDurationMs: number;
  /** Reference sentence text (server-side only). */
  sentenceText: string;
}

export interface RepeatSentenceResponse {
  recordingId: string;
}
