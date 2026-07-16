import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import type { RecordingProfile } from '@pte-app/contracts';
import type { QuestionRendererProps } from '../../question-engine/types.js';

before(() => {
  (globalThis as any).navigator ??= {
    mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [] }) },
  } as any;
  (globalThis as any).window ??= {};
});

after(() => {
  delete (globalThis as any).navigator;
  delete (globalThis as any).window;
});

function makeProfile(overrides: Partial<RecordingProfile> = {}): RecordingProfile {
  return {
    id: 'rp_test' as any,
    version: 1,
    preparationPolicy: { countdownSeconds: 30, autoStartRecording: true, allowSkip: true },
    recordingPolicy: { maxDurationSeconds: 40, permittedAttempts: 1, allowPause: false },
    uploadPolicy: { chunkSizeBytes: 512 * 1024, maxRetryCount: 3, resumeSupport: true },
    playbackPolicy: { allowPlaybackAfterUpload: false, maxPlaybackPlays: 0 },
    mockRestrictions: { singleAttempt: true, noRetake: true, noReview: true },
    ...overrides,
  };
}

function makeProps(overrides: Record<string, unknown> = {}): QuestionRendererProps<any, any> {
  return {
    question: { type: 'read_aloud', instructions: 'test', promptText: 'test' },
    response: {},
    onChange: () => {},
    recordingProfile: makeProfile(),
    ...overrides,
  } as any;
}

describe('Speaking renderer prop interface', () => {
  it('ReadAloudRenderer accepts attemptId and recordingProfileId', async () => {
    const { ReadAloudRenderer: Comp } = await import('./read-aloud.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          attemptId: 'att-1',
          recordingProfileId: 'rp-1',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('RepeatSentenceRenderer accepts attemptId and recordingProfileId', async () => {
    const { RepeatSentenceRenderer: Comp } = await import('./repeat-sentence.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test', sentence: 'hello' },
          attemptId: 'att-2',
          recordingProfileId: 'rp-2',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('DescribeImageRenderer accepts attemptId and recordingProfileId', async () => {
    const { DescribeImageRenderer: Comp } = await import('./describe-image.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test', imageUrl: '/img.png' },
          attemptId: 'att-3',
          recordingProfileId: 'rp-3',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('RetellLectureRenderer accepts attemptId and recordingProfileId', async () => {
    const { RetellLectureRenderer: Comp } = await import('./retell-lecture.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test', lectureNotes: [] },
          attemptId: 'att-4',
          recordingProfileId: 'rp-4',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('AnswerShortQuestionRenderer accepts attemptId and recordingProfileId', async () => {
    const { AnswerShortQuestionRenderer: Comp } = await import('./answer-short-question.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test', questionText: '?' },
          attemptId: 'att-5',
          recordingProfileId: 'rp-5',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('SummarizeGroupDiscussionRenderer accepts attemptId and recordingProfileId', async () => {
    const { SummarizeGroupDiscussionRenderer: Comp } = await import('./summarize-group-discussion.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test' },
          attemptId: 'att-6',
          recordingProfileId: 'rp-6',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });

  it('RespondToSituationRenderer accepts attemptId and recordingProfileId', async () => {
    const { RespondToSituationRenderer: Comp } = await import('./respond-to-situation.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(
        Comp,
        makeProps({
          question: { instructions: 'test', promptText: 'test', situationDescription: 'test' },
          attemptId: 'att-7',
          recordingProfileId: 'rp-7',
        }),
      ),
    );
    assert.ok(html.length > 0);
  });
});

describe('SpeakingRecorder accepts IDs and renders mic-check', () => {
  it('renders mic-check phase with attemptId and recordingProfileId props', async () => {
    const { SpeakingRecorder } = await import('./speaking-recorder.js');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      React.createElement(SpeakingRecorder, {
        recordingProfile: makeProfile(),
        onComplete: () => {},
        attemptId: 'att-rec',
        recordingProfileId: 'rp-rec',
      }),
    );
    assert.ok(html.includes('Checking microphone'));
  });
});
