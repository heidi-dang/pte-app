import type { ReadingCommonContract, ReadingPassage } from './common.js';

/**
 * Reading: Multiple Choice, Multiple Answers
 *
 * Candidate ID: reading_multiple_answers
 *
 * A passage followed by a question with multiple correct answers.
 * Candidates must select all correct options. Incorrect selections
 * attract a penalty in scoring (server-side only).
 */

export interface McqOption {
  /** Unique key within this question (e.g. "A", "B", "C", "D", "E"). */
  key: string;
  /** Display text of this option. */
  text: string;
}

export interface ReadingMultipleChoiceMultipleQuestion extends ReadingCommonContract {
  type: 'reading_multiple_answers';
  passage: ReadingPassage;
  /** The stem question displayed above the options list. */
  questionStem: string;
  /** Ordered list of selectable options. Correct keys NOT included here. */
  options: McqOption[];
  /** Minimum selections enforced by the UI (always ≥ 1). */
  minSelections: number;
  /** Maximum selections enforced by the UI (always ≤ options.length). */
  maxSelections: number;
}

export interface ReadingMultipleChoiceMultipleResponse {
  /** Set of selected option keys. Order is irrelevant for scoring. */
  selectedKeys: string[];
}
