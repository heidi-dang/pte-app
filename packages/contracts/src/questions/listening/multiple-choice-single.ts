import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Multiple Choice, Choose Single Answer
 *
 * Candidate ID: listening_single_answer
 *
 * An audio passage is played. The candidate selects one correct answer
 * from a list of options. Correct key is server-side only.
 */

export interface ListeningSingleMcqOption {
  /** Unique key within this question (e.g. "A", "B", "C", "D"). */
  key: string;
  /** Display text for this option. */
  text: string;
}

export interface ListeningSingleAnswerQuestion extends ListeningCommonContract {
  type: 'listening_single_answer';
  /** The stem question displayed above the radio group. */
  questionStem: string;
  /** Ordered list of selectable options. Correct key NOT included here. */
  options: ListeningSingleMcqOption[];
}

export interface ListeningSingleAnswerResponse {
  /** The selected option key, or null if no selection made. */
  selectedKey: string | null;
}
