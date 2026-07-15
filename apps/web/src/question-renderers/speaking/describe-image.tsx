'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type {
  DescribeImageQuestion,
  DescribeImageResponse,
  RecordingProfile,
  ScoringProfileId,
} from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

function buildProfile(q: { preparationTimeSeconds: number; recordingTimeSeconds: number }): RecordingProfile {
  return {
    id: 'runtime' as ScoringProfileId,
    version: 1,
    preparationPolicy: {
      countdownSeconds: q.preparationTimeSeconds,
      autoStartRecording: true,
      allowSkip: true,
    },
    recordingPolicy: {
      maxDurationSeconds: q.recordingTimeSeconds,
      permittedAttempts: 1,
      allowPause: false,
    },
    uploadPolicy: { chunkSizeBytes: 512 * 1024, maxRetryCount: 3, resumeSupport: true },
    playbackPolicy: { allowPlaybackAfterUpload: false, maxPlaybackPlays: 0 },
    mockRestrictions: { singleAttempt: false, noRetake: false, noReview: false },
  };
}

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
          recordingProfile={buildProfile(question)}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
