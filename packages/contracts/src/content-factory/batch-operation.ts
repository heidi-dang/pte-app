export interface BatchOperation {
  id: string;
  operationType: string;
  contentIds: string[];
  status: 'preview' | 'validating' | 'ready' | 'running' | 'partial' | 'completed' | 'failed' | 'cancelled';
  dryRun: boolean;
  results: Array<{ contentId: string; success: boolean; error?: string }>;
  idempotencyKey: string;
  createdAt: string;
  completedAt?: string;
}
