import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Retell Lecture
 *
 * Candidate listens to a lecture and retells the key points.
 */
export interface RetellLectureQuestion extends SpeakingCommonContract {
  type: 'retell_lecture';
  /** Optional lecture audio URL. */
  lectureAudioUrl?: string;
  /** Lecture notes shown after audio. */
  lectureNotes: string[];
  /** Key points for evaluation reference. */
  keyPoints: string[];
}

export interface RetellLectureResponse {
  recordingId: string;
}
