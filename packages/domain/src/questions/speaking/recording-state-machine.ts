import type { RecordingState } from '@pte-app/contracts';

const RECORDING_TRANSITIONS: Record<RecordingState, readonly RecordingState[]> = {
  'not-started': ['device-check', 'abandoned'],
  'device-check': ['preparing', 'failed'],
  preparing: ['opening-microphone', 'abandoned'],
  'opening-microphone': ['recording', 'failed'],
  recording: ['stopping', 'failed'],
  stopping: ['locally-preserved', 'failed'],
  'locally-preserved': ['upload-queued', 'abandoned'],
  'upload-queued': ['uploading', 'failed'],
  uploading: ['upload-paused', 'uploaded', 'failed'],
  'upload-paused': ['uploading', 'upload-retrying', 'abandoned'],
  'upload-retrying': ['uploading', 'failed'],
  uploaded: ['processing', 'available'],
  processing: ['available', 'failed'],
  available: [],
  failed: ['upload-retrying', 'abandoned'],
  abandoned: [],
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
  return state === 'available' || state === 'abandoned';
}

export function isActiveRecordingState(state: RecordingState): boolean {
  return state === 'recording' || state === 'uploading' || state === 'processing';
}
