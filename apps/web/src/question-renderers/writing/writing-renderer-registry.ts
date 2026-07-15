import type { ComponentType } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import { SummarizeWrittenTextRenderer } from './summarize-written-text.js';
import { WriteEssayRenderer } from './write-essay.js';

type AnyRenderer = ComponentType<QuestionRendererProps<never, never>>;

export const WRITING_RENDERER_REGISTRY: Record<string, AnyRenderer> = {
  summarize_written_text: SummarizeWrittenTextRenderer as unknown as AnyRenderer,
  write_essay: WriteEssayRenderer as unknown as AnyRenderer,
};
