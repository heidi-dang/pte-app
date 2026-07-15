import type { ReadingCommonContract, ReadingPassage } from './common.js';

/**
 * Reading & Writing: Fill in the Blanks
 *
 * Candidate ID: reading_writing_fill_blanks
 *
 * A passage with a number of gaps. Each gap has a dropdown of options.
 * The candidate selects one option per gap. All options and the correct
 * answers are server-side only — the client receives only option text lists.
 */

export interface RwFillBlankOption {
  /** Unique key within the gap (e.g. "a", "b", "c", "d"). */
  key: string;
  /** Display text shown in the dropdown. */
  text: string;
}

export interface RwFillBlankGap {
  /** Zero-based gap index; determines rendering order. */
  index: number;
  /** Ordered list of selectable options. Correct answer NOT included here. */
  options: RwFillBlankOption[];
}

export interface ReadingWritingFillBlanksQuestion extends ReadingCommonContract {
  type: 'reading_writing_fill_blanks';
  passage: ReadingPassage;
  /** Gaps in rendering order. The passage text uses {GAP:0}, {GAP:1}, … placeholders. */
  gaps: RwFillBlankGap[];
}

export interface ReadingWritingFillBlanksResponse {
  /** Map from gap index (as string key) to selected option key. */
  selections: Record<string, string>;
}
