import type { QuestionTypeHandler } from '@pte-app/contracts';
import { createSummarizeWrittenTextHandler } from './summarize-written-text.handler.js';
import { createWriteEssayHandler } from './write-essay.handler.js';

export function createWritingHandlers(): QuestionTypeHandler[] {
  return [createSummarizeWrittenTextHandler(), createWriteEssayHandler()];
}
