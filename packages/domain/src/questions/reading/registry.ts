import type { HandlerRegistry } from '../../question-engine/renderer-registry.js';
import { createReadingWritingFillBlanksHandler } from './reading-writing-fill-blanks.handler.js';
import { createReadingMultipleChoiceMultipleHandler } from './multiple-choice-multiple.handler.js';
import { createReorderParagraphHandler } from './reorder-paragraph.handler.js';
import { createReadingFillBlanksHandler } from './reading-fill-blanks.handler.js';
import { createReadingMultipleChoiceSingleHandler } from './multiple-choice-single.handler.js';

export function registerReadingHandlers(registry: HandlerRegistry): void {
  registry.register(createReadingWritingFillBlanksHandler());
  registry.register(createReadingMultipleChoiceMultipleHandler());
  registry.register(createReorderParagraphHandler());
  registry.register(createReadingFillBlanksHandler());
  registry.register(createReadingMultipleChoiceSingleHandler());
}
