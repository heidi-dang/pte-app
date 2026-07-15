'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse } from '@pte-app/contracts';
import { SpeakingRecorder } from './speaking-recorder.js';

export function SummarizeGroupDiscussionRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Summarize Group Discussion">
      <p>{question.instructions}</p>
      {!disabled && !response?.recordingId && (
        <SpeakingRecorder
          preparationSeconds={question.preparationTimeSeconds}
          maxDurationSeconds={question.recordingTimeSeconds}
          autoStartRecording={true}
          onComplete={(recordingId) =>
            onChange({ recordingId }, response?.writtenSummary !== undefined ? 'incomplete' : 'complete')
          }
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
