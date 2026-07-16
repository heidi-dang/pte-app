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
  recordingProfile,
  attemptId,
  recordingProfileId,
}: QuestionRendererProps<ReadAloudQuestion, ReadAloudResponse>) {
  if (!question || !recordingProfile) return null;

  const handleComplete = (recordingId: string) => {
    onChange({ recordingId }, 'complete');
  };

  return (
    <div role="group" aria-label="Read Aloud">
      <p>{question.instructions}</p>
      {question.showText && (
        <div aria-label="Passage to read" style={{ padding: '16px', border: '1px solid #ccc' }}>
          {question.passage.text}
        </div>
      )}
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          recordingProfile={recordingProfile}
          onComplete={handleComplete}
          attemptId={attemptId}
          recordingProfileId={recordingProfileId ?? recordingProfile.id}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
