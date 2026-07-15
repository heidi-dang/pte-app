export interface ImportJob {
  id: string;
  sourceType: 'csv' | 'json' | 'xml' | 'api';
  sourceReference: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  itemCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ item: number; message: string }>;
  createdAt: string;
  completedAt?: string;
}
