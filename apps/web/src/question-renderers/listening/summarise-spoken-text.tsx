'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { SummariseSpokenTextQuestion, SummariseSpokenTextResponse } from '@pte-app/contracts';
import { ListeningAudioController, ListeningAudioStatus } from './listening-audio-controller.js';

/**
 * Listening: Summarise Spoken Text renderer.
 *
 * - Text area for summary
 * - Word count display
 * - Audio player with server grant
 * - No transcript during attempt
 */
export function SummariseSpokenTextRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<SummariseSpokenTextQuestion, SummariseSpokenTextResponse>) {
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      onChange({ summary: text, wordCount }, text.trim().length > 0 ? 'complete' : 'empty');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Summarise Spoken Text">
      {question?.instructions && <p className="sst-instructions">{question.instructions}</p>}

      <ListeningAudioController playbackGrant={null} isPlaybackAllowed={true}>
        {(state) => {
          return <ListeningAudioStatus state={state as never} />;
        }}
      </ListeningAudioController>

      <label htmlFor="sst-summary" className="sr-only">
        Write your summary
      </label>
      <textarea
        id="sst-summary"
        value={response?.summary ?? ''}
        onChange={handleTextChange}
        disabled={disabled}
        placeholder="Write your summary here..."
        rows={8}
        aria-label="Summary text"
        style={{ width: '100%', minHeight: '120px', fontSize: '16px' }}
      />

      <div className="sst-word-count" aria-live="polite">
        Words: {response?.wordCount ?? 0}
        {question?.minWords !== undefined && ` (min: ${question.minWords})`}
        {question?.maxWords !== undefined && ` (max: ${question.maxWords})`}
      </div>
    </div>
  );
}
