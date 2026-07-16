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
  'expired',
]);

const iso8601String = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Must be a valid ISO-8601 timestamp' });

export const RecordingResponseSchema = z
  .object({
    recordingId: z
      .string()
      .min(1)
      .refine((s) => s.trim() === s, {
        message: 'Recording ID must not be whitespace-only',
      }),
    mediaObjectId: z.string().optional(),
    uploadSessionId: z.string().optional(),
    recordingProfileId: z.string().min(1),
    durationMs: z.number().int().min(0),
    localPreservationState: z.enum(['none', 'preserved', 'expired']),
    uploadedChunkCount: z.number().int().min(0),
    totalChunkCount: z.number().int().min(0),
    checksum: z.string().optional(),
    finalisationState: z.enum(['pending', 'finalised', 'rejected']),
  })
  .superRefine((data, ctx) => {
    if (data.uploadedChunkCount > data.totalChunkCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uploadedChunkCount cannot exceed totalChunkCount',
        path: ['uploadedChunkCount'],
      });
    }
    if (data.finalisationState === 'finalised') {
      if (data.totalChunkCount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Finalised recording must have totalChunkCount >= 1',
          path: ['totalChunkCount'],
        });
      }
      if (data.uploadedChunkCount < data.totalChunkCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Finalised recording cannot have missing chunks',
          path: ['uploadedChunkCount'],
        });
      }
    }
  });

export const UploadSessionSchema = z
  .object({
    id: z.string(),
    recordingId: z.string(),
    totalChunks: z.number().int().min(1),
    acknowledgedChunks: z.number().int().min(0),
    state: z.enum(['active', 'paused', 'completed', 'failed', 'expired']),
    createdAt: iso8601String,
    updatedAt: iso8601String,
  })
  .superRefine((data, ctx) => {
    if (data.acknowledgedChunks > data.totalChunks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'acknowledgedChunks cannot exceed totalChunks',
        path: ['acknowledgedChunks'],
      });
    }
  });

export const UploadChunkSchema = z.object({
  id: z.string(),
  uploadSessionId: z.string(),
  sequenceNumber: z.number().int().min(0),
  byteCount: z.number().int().min(1),
  acknowledgedAt: iso8601String.optional(),
});

export const MediaCapabilityDescriptorSchema = z.object({
  mimeTypes: z.array(z.string().regex(/^\w+\/[\w.+-]+$/, 'Must be a valid MIME type')),
  codecs: z.array(z.string()),
  sampleRates: z.array(z.number().int().min(1)),
  channelCount: z.number().int().min(1),
  browserCapabilityResult: z.enum(['supported', 'partial', 'unsupported', 'unknown']),
});

export const RecordingAttemptRightSchema = z.object({
  id: z.string(),
  recordingId: z.string(),
  permittedAt: iso8601String,
  consumedAt: iso8601String.optional(),
  result: z.enum(['uploaded', 'failed', 'abandoned', 'expired']).optional(),
});
