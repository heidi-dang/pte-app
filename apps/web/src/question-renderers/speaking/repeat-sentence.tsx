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
  recordingProfile,
  attemptId,
  recordingProfileId,
}: QuestionRendererProps<RepeatSentenceQuestion, RepeatSentenceResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Repeat Sentence">
      <p>{question.instructions}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          recordingProfile={recordingProfile}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
          attemptId={attemptId}
          recordingProfileId={recordingProfileId ?? recordingProfile.id}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
