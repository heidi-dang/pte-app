import type { ComponentType } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { WebRendererRegistry } from '../../question-engine/renderer-registry.js';
import { ReadingWritingFillBlanksRenderer } from './reading-writing-fill-blanks.js';
import { ReadingMultipleChoiceMultipleRenderer } from './multiple-choice-multiple.js';
import { ReorderParagraphRenderer } from './reorder-paragraph.js';
import { ReadingFillBlanksRenderer } from './reading-fill-blanks.js';
import { ReadingMultipleChoiceSingleRenderer } from './multiple-choice-single.js';

type AnyRenderer = ComponentType<QuestionRendererProps<unknown, unknown>>;

export function registerReadingRenderers(registry: WebRendererRegistry): void {
  registry.register('reading_writing_fill_blanks', ReadingWritingFillBlanksRenderer as unknown as AnyRenderer);
  registry.register('reading_multiple_answers', ReadingMultipleChoiceMultipleRenderer as unknown as AnyRenderer);
  registry.register('reorder_paragraph', ReorderParagraphRenderer as unknown as AnyRenderer);
  registry.register('reading_fill_blanks', ReadingFillBlanksRenderer as unknown as AnyRenderer);
  registry.register('reading_single_answer', ReadingMultipleChoiceSingleRenderer as unknown as AnyRenderer);
}
