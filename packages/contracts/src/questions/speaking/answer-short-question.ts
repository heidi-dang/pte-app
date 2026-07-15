import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Answer Short Question
 *
 * Candidate answers a brief question with a short spoken response.
 */
export interface AnswerShortQuestion extends SpeakingCommonContract {
  type: 'answer_short_question';
  /** The question text. */
  questionText: string;
  /** Expected answer keywords for evaluation. */
  expectedAnswerKeywords: string[];
}

export interface AnswerShortQuestionResponse {
  recordingId: string;
}
