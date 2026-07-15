/**
 * Evaluation request — references response, question version, and profiles.
 */
export interface EvaluationRequest {
  responseId: string;
  questionVersionId: string;
  taskType: string;
  /** Media reference for speech, text reference for writing. */
  mediaReference?: string;
  textReference?: string;
  evaluationProfileVersion: number;
  scoringProfileId: string;
  scoringProfileVersion: number;
  providerConfigReference: string;
  correlationId: string;
  idempotencyKey: string;
}
