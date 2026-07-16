/**
 * Shared speaking question contract types.
 * All speaking tasks share a common recording-based structure.
 */

export interface SpeakingCommonContract {
  /** Canonical task type identifier from the manifest. */
  type: string;
  /** Human-readable instructions shown before recording. */
  instructions: string;
  /** Preparation time in seconds before recording begins. */
  preparationTimeSeconds: number;
  /** Maximum recording time in seconds. */
  recordingTimeSeconds: number;
  /** Whether the candidate may retake the recording. */
  allowsRetake: boolean;
  /** Optional audio profile ID linking to the playback configuration. */
  audioProfileId?: string;
}
