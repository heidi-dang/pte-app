import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Respond to a Situation
 *
 * Candidate reads a situation description and responds verbally.
 */
export interface RespondToSituationQuestion extends SpeakingCommonContract {
  type: 'respond_to_situation';
  /** Description of the situation. */
  situationDescription: string;
  /** Prompt text shown to the candidate. */
  promptText: string;
}

export interface RespondToSituationResponse {
  recordingId: string;
}
