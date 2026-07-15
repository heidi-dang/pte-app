import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Multiple Choice, Choose Multiple Answers
 *
 * Candidate ID: listening_multiple_answers
 *
 * An audio passage is played. The candidate selects all correct answers
 * from a list of options. Incorrect selections attract a penalty.
 * Correct keys are server-side only.
 */

export interface ListeningMcqOption {
  /** Unique key within this question (e.g. "A", "B", "C", "D", "E"). */
  key: string;
  /** Display text of this option. */
  text: string;
}

export interface ListeningMultipleAnswersQuestion extends ListeningCommonContract {
  type: 'listening_multiple_answers';
  /** The stem question displayed above the options list. */
  questionStem: string;
  /** Ordered list of selectable options. Correct keys NOT included here. */
  options: ListeningMcqOption[];
  /** Minimum selections enforced by the UI (always ≥ 1). */
  minSelections: number;
  /** Maximum selections enforced by the UI (always ≤ options.length). */
  maxSelections: number;
}

export interface ListeningMultipleAnswersResponse {
  /** Set of selected option keys. Order is irrelevant for scoring. */
  selectedKeys: string[];
}
