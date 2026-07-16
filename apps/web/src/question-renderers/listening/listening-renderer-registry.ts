import type { ComponentType } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { WebRendererRegistry } from '../../question-engine/renderer-registry.js';
import { SummariseSpokenTextRenderer } from './summarise-spoken-text.js';
import { ListeningMultipleChoiceSingleRenderer } from './multiple-choice-single.js';
import { ListeningMultipleChoiceMultipleRenderer } from './multiple-choice-multiple.js';
import { ListeningFillBlanksRenderer } from './fill-blanks.js';
import { HighlightCorrectSummaryRenderer } from './highlight-correct-summary.js';
import { SelectMissingWordRenderer } from './select-missing-word.js';
import { HighlightIncorrectWordsRenderer } from './highlight-incorrect-words.js';
import { WriteFromDictationRenderer } from './write-from-dictation.js';

type AnyRenderer = ComponentType<QuestionRendererProps<unknown, unknown>>;

export function registerListeningRenderers(registry: WebRendererRegistry): void {
  registry.register('summarise_spoken_text', SummariseSpokenTextRenderer as unknown as AnyRenderer);
  registry.register('listening_single_answer', ListeningMultipleChoiceSingleRenderer as unknown as AnyRenderer);
  registry.register('listening_multiple_answers', ListeningMultipleChoiceMultipleRenderer as unknown as AnyRenderer);
  registry.register('listening_fill_blanks', ListeningFillBlanksRenderer as unknown as AnyRenderer);
  registry.register('highlight_correct_summary', HighlightCorrectSummaryRenderer as unknown as AnyRenderer);
  registry.register('select_missing_word', SelectMissingWordRenderer as unknown as AnyRenderer);
  registry.register('highlight_incorrect_words', HighlightIncorrectWordsRenderer as unknown as AnyRenderer);
  registry.register('write_from_dictation', WriteFromDictationRenderer as unknown as AnyRenderer);
}
