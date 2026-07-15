import type { ReadingCommonContract } from './common.js';

/**
 * Reading: Re-order Paragraphs
 *
 * Candidate ID: reorder_paragraph
 *
 * A set of text boxes are presented in a randomised (shuffled) order.
 * The candidate drags or uses controls to arrange them into the correct order.
 * The correct order is server-side only.
 */

export interface ReorderParagraphItem {
  /** Stable unique key for this paragraph box (e.g. UUID). */
  id: string;
  /** The text content of this paragraph box. */
  text: string;
}

export interface ReorderParagraphQuestion extends ReadingCommonContract {
  type: 'reorder_paragraph';
  /**
   * Paragraphs in the initial (shuffled) display order as delivered to the
   * client. Correct order is NOT embedded here.
   */
  items: ReorderParagraphItem[];
}

export interface ReorderParagraphResponse {
  /**
   * Item IDs in the candidate's current arrangement order (index 0 = first).
   */
  orderedIds: string[];
}
