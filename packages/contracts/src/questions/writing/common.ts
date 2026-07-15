/**
 * Shared writing question contract types.
 * All writing tasks share a common text-based structure.
 */

export interface WritingCommonContract {
  /** Canonical task type identifier from the manifest. */
  type: string;
  /** Human-readable instructions shown above the editor. */
  instructions: string;
  /** Maximum word count for the response. */
  maxWords: number;
  /** Minimum word count for the response. */
  minWords: number;
}
