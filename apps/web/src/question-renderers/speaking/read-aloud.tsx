'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadAloudQuestion, ReadAloudResponse, RecordingProfile, ScoringProfileId } from '@pte-app/contracts';
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

export function ReadAloudRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadAloudQuestion, ReadAloudResponse>) {
  if (!question) return null;

  const handleComplete = (recordingId: string) => {
    onChange({ recordingId }, 'complete');
  };

  return (
    <div role="group" aria-label="Read Aloud">
      <p>{question.instructions}</p>
      {question.showText && (
        <div aria-label="Passage to read" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
          {question.passage.text}
        </div>
      )}
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder recordingProfile={buildProfile(question)} onComplete={handleComplete} />
      )}
      {response?.recordingId && <p role="status">Recording complete</p>}
    </div>
  );
}
