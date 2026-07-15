'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { RespondToSituationQuestion, RespondToSituationResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function RespondToSituationRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<RespondToSituationQuestion, RespondToSituationResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Respond to Situation">
      <p>{question.instructions}</p>
      <div
        aria-label="Situation description"
        style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
      >
        {question.situationDescription}
      </div>
      <p>{question.promptText}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          preparationSeconds={question.preparationTimeSeconds}
          maxDurationSeconds={question.recordingTimeSeconds}
          autoStartRecording={true}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
