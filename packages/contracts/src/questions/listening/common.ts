/**
 * Shared listening question contract types.
 * All listening tasks share a common audio-based structure.
 */

export interface ListeningCommonContract {
  /** Canonical task type identifier from the manifest. */
  type: string;
  /** Human-readable instructions shown above the audio player. */
  instructions: string;
  /** Optional audio profile ID linking to the playback configuration. */
  audioProfileId?: string;
}
