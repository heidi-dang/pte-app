'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { AnswerShortQuestion, AnswerShortQuestionResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function AnswerShortQuestionRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<AnswerShortQuestion, AnswerShortQuestionResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Answer Short Question">
      <p>{question.questionText}</p>
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
