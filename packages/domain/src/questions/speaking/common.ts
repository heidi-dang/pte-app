import type { SubmissionValidationResult } from '@pte-app/contracts';

export const SPEAKING_MANIFEST_BASE = {
  contractVersion: '1.0.0',
  questionSchemaVersion: '1.0.0',
  responseSchemaVersion: '1.0.0',
  capabilities: {
    supportsReview: false,
    supportsPlayback: false,
    supportsAutosave: false,
    supportsKeyboard: true,
    supportsTouchInteraction: true,
    supportsScreenReader: true,
    supportsReducedMotion: true,
  },
  accessibility: {
    keyboardOperable: true,
    screenReaderAnnouncements: true,
    visibleFocusStates: true,
    nonColourOnlyStatus: true,
    reducedMotionCompatible: true,
    touchCompatibleControls: true,
  },
} as const;

export interface ValidatedRecordingContext {
  recordingId: string;
  userId: string;
  recordingProfileId: string;
  state: string;
  finalisationState: string;
  uploadSessionId: string | null;
  uploadedChunkCount: number;
  totalChunkCount: number;
  durationMs: number;
}

export function validateRecordingSubmission(
  recording: ValidatedRecordingContext | null | undefined,
  expectedUserId: string,
  _allowsEmptySubmission: boolean,
): SubmissionValidationResult {
  if (!recording) {
    return { valid: true };
  }

  const trimmedId = recording.recordingId.trim();
  if (!trimmedId) {
    return { valid: false, reason: 'Recording ID is required and must not be whitespace-only' };
  }

  if (expectedUserId && recording.userId !== expectedUserId) {
    return { valid: false, reason: 'Recording does not belong to this learner' };
  }

  if (recording.finalisationState !== 'finalised') {
    return { valid: false, reason: `Recording is not finalised (state: ${recording.finalisationState})` };
  }

  if (recording.state === 'abandoned' || recording.state === 'expired') {
    return { valid: false, reason: `Recording is in terminal state: ${recording.state}` };
  }

  if (recording.state === 'uploading' || recording.state === 'upload-queued') {
    return { valid: false, reason: `Recording upload is still in progress: ${recording.state}` };
  }

  if (recording.uploadedChunkCount < recording.totalChunkCount) {
    return { valid: false, reason: 'Recording has missing chunks' };
  }

  if (recording.durationMs <= 0) {
    return { valid: false, reason: 'Recording duration must be positive' };
  }

  return { valid: true };
}
