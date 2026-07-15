'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { DescribeImageQuestion, DescribeImageResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function DescribeImageRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<DescribeImageQuestion, DescribeImageResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Describe Image">
      <p>{question.instructions}</p>
      <img src={question.imageUrl} alt={question.promptText} style={{ maxWidth: '100%', maxHeight: '300px' }} />
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
