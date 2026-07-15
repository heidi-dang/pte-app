'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadAloudQuestion, ReadAloudResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function ReadAloudRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadAloudQuestion, ReadAloudResponse>) {
  if (!question) return null;

  const handleComplete = (recordingId: string) => {
    onChange({ recordingId }, 'complete');
  };

  return (
    <div role="group" aria-label="Read Aloud">
      <p>{question.instructions}</p>
      {question.showText && (
        <div aria-label="Passage to read" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
          {question.passage.text}
        </div>
      )}
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          preparationSeconds={question.preparationTimeSeconds}
          maxDurationSeconds={question.recordingTimeSeconds}
          autoStartRecording={true}
          onComplete={handleComplete}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
