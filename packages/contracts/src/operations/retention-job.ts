export interface RetentionJob {
  id: string;
  policyVersion: number;
  targetDataClass: string;
  eligibilityCount: number;
  preview: boolean;
  dryRun: boolean;
  excludedIds: string[];
  legalHoldIds: string[];
  status: 'preview' | 'running' | 'completed' | 'failed' | 'cancelled';
  deletedCount?: number;
  failureReason?: string;
  createdAt: string;
}
