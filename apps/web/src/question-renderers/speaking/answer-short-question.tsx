'use client';

import React from 'react';
import { SpeakingRecorder } from './speaking-recorder.js';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { AnswerShortQuestion, AnswerShortQuestionResponse } from '@pte-app/contracts';

export function AnswerShortQuestionRenderer({
  question,
  response,
  onChange,
  disabled,
  recordingProfile,
}: QuestionRendererProps<AnswerShortQuestion, AnswerShortQuestionResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Answer Short Question">
      <p>{question.questionText}</p>
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
