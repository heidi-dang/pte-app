'use client';

import React from 'react';
import { SpeakingRecorder } from './speaking-recorder.js';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { RetellLectureQuestion, RetellLectureResponse } from '@pte-app/contracts';

export function RetellLectureRenderer({
  question,
  response,
  onChange,
  disabled,
  recordingProfile,
  attemptId,
  recordingProfileId,
}: QuestionRendererProps<RetellLectureQuestion, RetellLectureResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Retell Lecture">
      <p>{question.instructions}</p>
      {question.lectureNotes.length > 0 && (
        <div aria-label="Lecture notes">
          <ul>
            {question.lectureNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
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
