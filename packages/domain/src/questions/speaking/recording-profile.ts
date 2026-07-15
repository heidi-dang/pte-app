import type { RecordingProfile, RecordingProfileId } from '@pte-app/contracts';

export function createDefaultRecordingProfile(overrides: Partial<RecordingProfile> = {}): RecordingProfile {
  return {
    id: 'rp_default' as RecordingProfileId,
    version: 1,
    preparationPolicy: {
      countdownSeconds: 30,
      autoStartRecording: true,
      allowSkip: true,
    },
    recordingPolicy: {
      maxDurationSeconds: 40,
      permittedAttempts: 1,
      allowPause: false,
    },
    uploadPolicy: {
      chunkSizeBytes: 512 * 1024,
      maxRetryCount: 3,
      resumeSupport: true,
    },
    playbackPolicy: {
      allowPlaybackAfterUpload: false,
      maxPlaybackPlays: 0,
    },
    mockRestrictions: {
      singleAttempt: true,
      noRetake: true,
      noReview: true,
    },
    ...overrides,
  };
}
