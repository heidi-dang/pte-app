import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Highlight Correct Summary
 *
 * Candidate ID: highlight_correct_summary
 *
 * An audio passage is played. The candidate selects one summary that
 * best matches the spoken text from a list of options.
 * Correct key is server-side only.
 */

export interface HighlightCorrectSummaryOption {
  /** Unique key within this question (e.g. "A", "B", "C"). */
  key: string;
  /** The summary text for this option. */
  text: string;
}

export interface HighlightCorrectSummaryQuestion extends ListeningCommonContract {
  type: 'highlight_correct_summary';
  /** Ordered list of summary options. Correct key NOT included here. */
  options: HighlightCorrectSummaryOption[];
}

export interface HighlightCorrectSummaryResponse {
  /** The selected option key, or null if no selection made. */
  selectedKey: string | null;
}
