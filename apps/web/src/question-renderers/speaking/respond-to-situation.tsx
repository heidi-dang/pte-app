'use client';

import React from 'react';
import { SpeakingRecorder } from './speaking-recorder.js';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { RespondToSituationQuestion, RespondToSituationResponse } from '@pte-app/contracts';

export function RespondToSituationRenderer({
  question,
  response,
  onChange,
  disabled,
  recordingProfile,
}: QuestionRendererProps<RespondToSituationQuestion, RespondToSituationResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Respond to Situation">
      <p>{question.instructions}</p>
      <div aria-label="Situation description" style={{ padding: '16px', border: '1px solid #ccc' }}>
        {question.situationDescription}
      </div>
      <p>{question.promptText}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          recordingProfile={recordingProfile}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
