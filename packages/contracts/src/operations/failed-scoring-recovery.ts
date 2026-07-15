export interface ScoringRecoveryRequest {
  id: string;
  responseId: string;
  originalEvaluationId: string;
  originalResponsePreserved: boolean;
  action: 'retry-same-profile' | 'retry-new-profile' | 'manual-review';
  newProfileId?: string;
  newProfileVersion?: number;
  resultType: 'retry' | 'rescore';
  status: 'requested' | 'processing' | 'completed' | 'failed';
  newResultId?: string;
  createdAt: string;
}
