export interface AdministrativeProgress {
  id: string;
  jobType: string;
  currentStage: string;
  percentage: number;
  completedItems: number;
  failedItems: number;
  totalItems: number;
  retryState: 'idle' | 'retrying' | 'max-retries-reached';
  correlationId: string;
  lastUpdated: string;
  stale: boolean;
}
