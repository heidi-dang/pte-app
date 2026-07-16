import type { RecordingState } from '@pte-app/contracts';

const RECORDING_TRANSITIONS: Record<RecordingState, readonly RecordingState[]> = {
  'not-started': ['device-check', 'abandoned', 'expired'],
  'device-check': ['preparing', 'failed', 'abandoned', 'expired'],
  preparing: ['opening-microphone', 'abandoned', 'expired'],
  'opening-microphone': ['recording', 'failed', 'abandoned', 'expired'],
  recording: ['stopping', 'failed', 'abandoned', 'expired'],
  stopping: ['locally-preserved', 'failed', 'abandoned', 'expired'],
  'locally-preserved': ['upload-queued', 'abandoned', 'expired'],
  'upload-queued': ['uploading', 'failed', 'abandoned', 'expired'],
  uploading: ['upload-paused', 'uploaded', 'failed', 'abandoned', 'expired'],
  'upload-paused': ['uploading', 'upload-retrying', 'abandoned', 'expired'],
  'upload-retrying': ['uploading', 'failed', 'abandoned', 'expired'],
  uploaded: ['processing', 'available'],
  processing: ['available', 'failed'],
  available: [],
  failed: ['upload-retrying', 'abandoned', 'expired'],
  abandoned: [],
  expired: [],
};

export function canTransitionRecording(from: RecordingState, to: RecordingState): boolean {
  return RECORDING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionRecording(from: RecordingState, to: RecordingState): RecordingState {
  if (!canTransitionRecording(from, to)) {
    throw new Error(`Invalid recording transition: ${from} → ${to}`);
  }
  return to;
}

export function isTerminalRecordingState(state: RecordingState): boolean {
  return state === 'available' || state === 'abandoned' || state === 'expired' || state === 'failed';
}

export function isActiveRecordingState(state: RecordingState): boolean {
  return state === 'recording' || state === 'uploading' || state === 'processing' || state === 'upload-retrying';
}

export function isMutableRecordingState(state: RecordingState): boolean {
  return !isTerminalRecordingState(state);
}
