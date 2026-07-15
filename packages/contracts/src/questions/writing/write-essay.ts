import type { WritingCommonContract } from './common.js';

/**
 * Writing: Write Essay
 *
 * Candidate writes an essay on a given topic.
 */
export interface WriteEssayQuestion extends WritingCommonContract {
  type: 'write_essay';
  /** The essay prompt/topic. */
  prompt: string;
  /** Additional context or discussion text. */
  discussionText?: string;
}

export interface WriteEssayResponse {
  text: string;
}
