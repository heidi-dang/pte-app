export interface RetryOperation {
  id: string;
  originalJobId: string;
  originalPayloadReference: string;
  failureReason: string;
  retryPolicy: string;
  retryCount: number;
  nextAllowedRetry?: string;
  idempotencyKey: string;
  replacementJobId?: string;
  originalJobPreserved: boolean;
  status: 'requested' | 'executing' | 'completed' | 'failed';
  createdAt: string;
}
