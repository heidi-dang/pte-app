import type { ReadingCommonContract, ReadingPassage } from './common.js';

/**
 * Reading: Multiple Choice, Single Answer
 *
 * Candidate ID: reading_single_answer
 *
 * A passage followed by a question with exactly one correct answer.
 * The candidate selects one radio option. Correct key is server-side only.
 */

export interface SingleMcqOption {
  /** Unique key within this question (e.g. "A", "B", "C", "D"). */
  key: string;
  /** Display text for this option. */
  text: string;
}

export interface ReadingMultipleChoiceSingleQuestion extends ReadingCommonContract {
  type: 'reading_single_answer';
  passage: ReadingPassage;
  /** The stem question displayed above the radio group. */
  questionStem: string;
  /** Ordered list of selectable options. Correct key NOT included here. */
  options: SingleMcqOption[];
}

export interface ReadingMultipleChoiceSingleResponse {
  /** The selected option key, or null if no selection made. */
  selectedKey: string | null;
}
