/**
 * Shared reading question contract types.
 * All reading tasks share a common passage structure.
 */

export interface ReadingPassage {
  /** Unique identifier for this passage within the question version. */
  id: string;
  /** Rendered HTML-safe text of the passage. No correct answers may be embedded. */
  text: string;
  /** Word count (informational, computed server-side). */
  wordCount: number;
}

export interface ReadingCommonContract {
  /** Canonical task type identifier from the manifest. */
  type: string;
  /** Human-readable instructions shown above the passage/question. */
  instructions: string;
  /** The reading passage, if applicable for this task type. */
  passage?: ReadingPassage;
}
