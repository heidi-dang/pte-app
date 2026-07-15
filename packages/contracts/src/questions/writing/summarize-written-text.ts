import type { WritingCommonContract } from './common.js';

/**
 * Writing: Summarize Written Text
 *
 * Candidate reads a passage and writes a one-sentence summary.
 */
export interface SummarizeWrittenTextQuestion extends WritingCommonContract {
  type: 'summarize_written_text';
  /** The passage to summarize. */
  passage: string;
}

export interface SummarizeWrittenTextResponse {
  text: string;
}
