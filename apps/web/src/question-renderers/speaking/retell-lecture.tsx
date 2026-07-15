'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { RetellLectureQuestion, RetellLectureResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function RetellLectureRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<RetellLectureQuestion, RetellLectureResponse>) {
  if (!question) return null;

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
