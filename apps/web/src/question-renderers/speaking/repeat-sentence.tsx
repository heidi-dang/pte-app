'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { RepeatSentenceQuestion, RepeatSentenceResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function RepeatSentenceRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<RepeatSentenceQuestion, RepeatSentenceResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Repeat Sentence">
      <p>{question.instructions}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          preparationSeconds={question.preparationTimeSeconds}
          maxDurationSeconds={question.recordingTimeSeconds}
          autoStartRecording={false}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
