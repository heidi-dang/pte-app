'use client';

import React from 'react';
import { SpeakingRecorder } from './speaking-recorder.js';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse } from '@pte-app/contracts';

export function SummarizeGroupDiscussionRenderer({
  question,
  response,
  onChange,
  disabled,
  recordingProfile,
}: QuestionRendererProps<SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse>) {
  if (!question || !recordingProfile) return null;

  return (
    <div role="group" aria-label="Summarize Group Discussion">
      <p>{question.instructions}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          recordingProfile={recordingProfile}
          onComplete={(recordingId) => onChange({ recordingId }, 'incomplete')}
        />
      )}
      {response?.recordingId && (
        <div>
          <p role="status">Recording complete</p>
          {!disabled && (
            <textarea
              aria-label="Written summary"
              value={response.writtenSummary ?? ''}
              onChange={(e) =>
                onChange({ recordingId: response.recordingId, writtenSummary: e.target.value }, 'incomplete')
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
