'use client';

import React from 'react';
import { SpeakingRecorder } from './speaking-recorder.js';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { DescribeImageQuestion, DescribeImageResponse } from '@pte-app/contracts';

export function DescribeImageRenderer({
  question,
  response,
  onChange,
  disabled,
  recordingProfile,
}: QuestionRendererProps<DescribeImageQuestion, DescribeImageResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Describe Image">
      <p>{question.instructions}</p>
      <img src={question.imageUrl} alt={question.promptText} style={{ maxWidth: '100%', maxHeight: '300px' }} />
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
