import type { ListeningCommonContract } from './common.js';

/**
 * Listening: Select Missing Word
 *
 * Candidate ID: select_missing_word
 *
 * An audio passage is played with a transcript displayed. The final
 * word or phrase is replaced by a placeholder. The candidate selects
 * the correct missing word from a list of options.
 * Correct key is server-side only.
 */

export interface SelectMissingWordOption {
  /** Unique key within this question (e.g. "A", "B", "C", "D"). */
  key: string;
  /** The word or phrase for this option. */
  text: string;
}

export interface SelectMissingWordQuestion extends ListeningCommonContract {
  type: 'select_missing_word';
  /** The transcript with the final word/phrase replaced by a placeholder. */
  transcript: string;
  /** Ordered list of selectable options. Correct key NOT included here. */
  options: SelectMissingWordOption[];
}

export interface SelectMissingWordResponse {
  /** The selected option key, or null if no selection made. */
  selectedKey: string | null;
}
