import type { HandlerRegistry } from '../../question-engine/renderer-registry.js';
import { createSummariseSpokenTextHandler } from './summarise-spoken-text.handler.js';
import { createListeningSingleAnswerHandler } from './multiple-choice-single.handler.js';
import { createListeningMultipleAnswersHandler } from './multiple-choice-multiple.handler.js';
import { createListeningFillBlanksHandler } from './fill-blanks.handler.js';
import { createHighlightCorrectSummaryHandler } from './highlight-correct-summary.handler.js';
import { createSelectMissingWordHandler } from './select-missing-word.handler.js';
import { createHighlightIncorrectWordsHandler } from './highlight-incorrect-words.handler.js';
import { createWriteFromDictationHandler } from './write-from-dictation.handler.js';

export function registerListeningHandlers(registry: HandlerRegistry): void {
  registry.register(createSummariseSpokenTextHandler());
  registry.register(createListeningSingleAnswerHandler());
  registry.register(createListeningMultipleAnswersHandler());
  registry.register(createListeningFillBlanksHandler());
  registry.register(createHighlightCorrectSummaryHandler());
  registry.register(createSelectMissingWordHandler());
  registry.register(createHighlightIncorrectWordsHandler());
  registry.register(createWriteFromDictationHandler());
}
