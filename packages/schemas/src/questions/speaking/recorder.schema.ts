import { z } from 'zod';

export const RecordingProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  preparationPolicy: z.object({
    countdownSeconds: z.number().int().min(0),
    autoStartRecording: z.boolean(),
    allowSkip: z.boolean(),
  }),
  recordingPolicy: z.object({
    maxDurationSeconds: z.number().int().min(1),
    permittedAttempts: z.number().int().min(1),
    allowPause: z.boolean(),
  }),
  uploadPolicy: z.object({
    chunkSizeBytes: z.number().int().min(1),
    maxRetryCount: z.number().int().min(0),
    resumeSupport: z.boolean(),
  }),
  playbackPolicy: z.object({
    allowPlaybackAfterUpload: z.boolean(),
    maxPlaybackPlays: z.number().int().min(0),
  }),
  mockRestrictions: z.object({
    singleAttempt: z.boolean(),
    noRetake: z.boolean(),
    noReview: z.boolean(),
  }),
});

export const RecordingStateSchema = z.enum([
  'not-started',
  'device-check',
  'preparing',
  'opening-microphone',
  'recording',
  'stopping',
  'locally-preserved',
  'upload-queued',
  'uploading',
  'upload-paused',
  'upload-retrying',
  'uploaded',
  'processing',
  'available',
  'failed',
  'abandoned',
]);

export const RecordingResponseSchema = z.object({
  recordingId: z.string(),
  mediaObjectId: z.string().optional(),
  uploadSessionId: z.string().optional(),
  recordingProfileId: z.string(),
  durationMs: z.number().int().min(0),
  localPreservationState: z.enum(['none', 'preserved', 'expired']),
  uploadedChunkCount: z.number().int().min(0),
  totalChunkCount: z.number().int().min(0),
  checksum: z.string().optional(),
  finalisationState: z.enum(['pending', 'finalised', 'rejected']),
});

export const UploadSessionSchema = z.object({
  id: z.string(),
  recordingId: z.string(),
  totalChunks: z.number().int().min(0),
  acknowledgedChunks: z.number().int().min(0),
  state: z.enum(['active', 'paused', 'completed', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UploadChunkSchema = z.object({
  id: z.string(),
  uploadSessionId: z.string(),
  sequenceNumber: z.number().int().min(0),
  acknowledgedAt: z.string().optional(),
});

export const MediaCapabilityDescriptorSchema = z.object({
  mimeTypes: z.array(z.string()),
  codecs: z.array(z.string()),
  sampleRates: z.array(z.number()),
  channelCount: z.number().int().min(1),
  browserCapabilityResult: z.enum(['supported', 'partial', 'unsupported', 'unknown']),
});

export const RecordingAttemptRightSchema = z.object({
  id: z.string(),
  recordingId: z.string(),
  permittedAt: z.string(),
  consumedAt: z.string().optional(),
  result: z.enum(['uploaded', 'failed', 'abandoned']).optional(),
});
