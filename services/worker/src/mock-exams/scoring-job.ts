/**
 * Scoring job — processes mock exam scoring.
 */
export interface MockScoringJob {
  id: string;
  sessionId: string;
  submissionId: string;
  state: 'queued' | 'scoring' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  errorMessage?: string;
  retryCount: number;
  correlationId: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
