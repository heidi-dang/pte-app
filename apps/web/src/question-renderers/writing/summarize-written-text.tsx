'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { SummarizeWrittenTextQuestion, SummarizeWrittenTextResponse } from '@pte-app/contracts';
import { WritingEditor } from './writing-editor.js';

export function SummarizeWrittenTextRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<SummarizeWrittenTextQuestion, SummarizeWrittenTextResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Summarize Written Text">
      <p>{question.instructions}</p>
      <div aria-label="Passage" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
        {question.passage}
      </div>
      <WritingEditor
        value={response?.text ?? ''}
        onChange={(text) => onChange({ text }, 'incomplete')}
        disabled={disabled}
        maxWords={question.maxWords}
        minWords={question.minWords}
        ariaLabel="Your summary"
      />
    </div>
  );
}
