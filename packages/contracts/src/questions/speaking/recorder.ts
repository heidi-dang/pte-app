import type { ScoringProfileId } from '../../question-engine/identifiers.js';

/**
 * Recording profile versioned configuration.
 * Controls preparation, recording, upload and playback policies.
 */
export interface RecordingProfile {
  id: ScoringProfileId;
  version: number;
  preparationPolicy: PreparationPolicy;
  recordingPolicy: RecordingPolicy;
  uploadPolicy: UploadPolicy;
  playbackPolicy: PlaybackPolicy;
  mockRestrictions: RecordingMockRestrictions;
}

export interface PreparationPolicy {
  countdownSeconds: number;
  autoStartRecording: boolean;
  allowSkip: boolean;
}

export interface RecordingPolicy {
  maxDurationSeconds: number;
  permittedAttempts: number;
  allowPause: boolean;
}

export interface UploadPolicy {
  chunkSizeBytes: number;
  maxRetryCount: number;
  resumeSupport: boolean;
}

export interface PlaybackPolicy {
  allowPlaybackAfterUpload: boolean;
  maxPlaybackPlays: number;
}

export interface RecordingMockRestrictions {
  singleAttempt: boolean;
  noRetake: boolean;
  noReview: boolean;
}

export type RecordingState =
  | 'not-started'
  | 'device-check'
  | 'preparing'
  | 'opening-microphone'
  | 'recording'
  | 'stopping'
  | 'locally-preserved'
  | 'upload-queued'
  | 'uploading'
  | 'upload-paused'
  | 'upload-retrying'
  | 'uploaded'
  | 'processing'
  | 'available'
  | 'failed'
  | 'abandoned';

export interface RecordingResponse {
  recordingId: string;
  mediaObjectId?: string;
  uploadSessionId?: string;
  recordingProfileId: ScoringProfileId;
  durationMs: number;
  localPreservationState: 'none' | 'preserved' | 'expired';
  uploadedChunkCount: number;
  totalChunkCount: number;
  checksum?: string;
  finalisationState: 'pending' | 'finalised' | 'rejected';
}

export interface UploadSession {
  id: string;
  recordingId: string;
  totalChunks: number;
  acknowledgedChunks: number;
  state: 'active' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UploadChunk {
  id: string;
  uploadSessionId: string;
  sequenceNumber: number;
  acknowledgedAt?: string;
}

export interface MediaCapabilityDescriptor {
  mimeTypes: string[];
  codecs: string[];
  sampleRates: number[];
  channelCount: number;
  browserCapabilityResult: 'supported' | 'partial' | 'unsupported' | 'unknown';
}

export interface RecordingAttemptRight {
  id: string;
  recordingId: string;
  permittedAt: string;
  consumedAt?: string;
  result?: 'uploaded' | 'failed' | 'abandoned';
}
