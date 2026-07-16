import type { UploadSession } from '@pte-app/contracts';

export interface UploadSessionState {
  session: UploadSession;
  acknowledgedSequenceNumbers: number[];
}

export function createUploadSession(
  input: { recordingId: string; totalChunks: number },
  generatedId: string,
  timestamp: string,
): UploadSessionState {
  if (input.totalChunks <= 0) {
    throw new Error('totalChunks must be greater than 0');
  }
  const session: UploadSession = {
    id: generatedId,
    recordingId: input.recordingId,
    totalChunks: input.totalChunks,
    acknowledgedChunks: 0,
    state: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return { session, acknowledgedSequenceNumbers: [] };
}

export function acknowledgeChunk(
  state: UploadSessionState,
  chunk: { sequenceNumber: number; acknowledgedAt: string },
): UploadSessionState {
  if (state.session.state === 'completed') {
    throw new Error('Cannot acknowledge chunk: upload session is already completed');
  }
  if (state.session.state === 'failed') {
    throw new Error('Cannot acknowledge chunk: upload session has failed');
  }
  if (state.session.state === 'expired') {
    throw new Error('Cannot acknowledge chunk: upload session has expired');
  }
  if (chunk.sequenceNumber < 0) {
    throw new Error(`Invalid negative sequence number: ${chunk.sequenceNumber}`);
  }
  if (chunk.sequenceNumber >= state.session.totalChunks) {
    throw new Error(`Sequence number ${chunk.sequenceNumber} exceeds total chunks ${state.session.totalChunks}`);
  }
  if (state.acknowledgedSequenceNumbers.includes(chunk.sequenceNumber)) {
    return state;
  }
  const updatedNumbers = [...state.acknowledgedSequenceNumbers, chunk.sequenceNumber].sort((a, b) => a - b);
  return {
    session: {
      ...state.session,
      acknowledgedChunks: updatedNumbers.length,
      updatedAt: chunk.acknowledgedAt,
    },
    acknowledgedSequenceNumbers: updatedNumbers,
  };
}

export function isUploadComplete(state: UploadSessionState): boolean {
  return state.acknowledgedSequenceNumbers.length >= state.session.totalChunks && state.session.totalChunks > 0;
}

export function detectMissingChunks(state: UploadSessionState): number[] {
  const acknowledged = new Set(state.acknowledgedSequenceNumbers);
  const missing: number[] = [];
  for (let i = 0; i < state.session.totalChunks; i++) {
    if (!acknowledged.has(i)) {
      missing.push(i);
    }
  }
  return missing;
}

export function canFinaliseUpload(state: UploadSessionState): boolean {
  if (state.session.state === 'completed') return false;
  if (state.session.state === 'failed') return false;
  if (state.session.state === 'expired') return false;
  return isUploadComplete(state);
}

export function finaliseUpload(state: UploadSessionState, timestamp: string): UploadSessionState {
  if (state.session.state === 'completed') {
    return state;
  }
  if (state.session.state === 'failed') {
    throw new Error('Cannot finalise: upload session has failed');
  }
  if (state.session.state === 'expired') {
    throw new Error('Cannot finalise: upload session has expired');
  }
  const missing = detectMissingChunks(state);
  if (missing.length > 0) {
    throw new Error(`Cannot finalise: missing chunks [${missing.join(', ')}]`);
  }
  return {
    ...state,
    session: {
      ...state.session,
      state: 'completed',
      updatedAt: timestamp,
    },
  };
}

export function isTerminalSessionState(state: UploadSession['state']): boolean {
  return state === 'completed' || state === 'failed' || state === 'expired';
}
