import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Summarize Group Discussion
 *
 * Candidate listens to a group discussion, then provides a spoken summary
 * and optional written summary.
 */
export interface SummarizeGroupDiscussionQuestion extends SpeakingCommonContract {
  type: 'summarize_group_discussion';
  /** Optional discussion audio URL. */
  discussionAudioUrl?: string;
  /** Server-side transcript for evaluation reference. */
  discussionTranscript: string;
  /** Maximum word count for written summary. */
  maxWords: number;
  /** Minimum word count for written summary. */
  minWords: number;
}

export interface SummarizeGroupDiscussionResponse {
  recordingId: string;
  writtenSummary?: string;
}
