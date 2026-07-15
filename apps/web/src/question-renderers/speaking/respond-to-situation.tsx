'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type {
  RespondToSituationQuestion,
  RespondToSituationResponse,
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
          recordingProfile={buildProfile(question)}
          onComplete={(recordingId) => onChange({ recordingId }, 'complete')}
        />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
