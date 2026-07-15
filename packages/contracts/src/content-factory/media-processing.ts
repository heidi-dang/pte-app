export interface MediaProcessingJob {
  id: string;
  contentId: string;
  sourceMediaId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number;
  outputMediaId?: string;
  integrityReference?: string;
  transcriptMediaRelationship?: string;
  originalPreserved: boolean;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}
