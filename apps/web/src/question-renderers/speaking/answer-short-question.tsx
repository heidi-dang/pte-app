'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type {
  AnswerShortQuestion,
  AnswerShortQuestionResponse,
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
          recordingProfile={buildProfile(question)}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
