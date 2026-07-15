export interface CalibrationReport {
  id: string;
  version: number;
  datasetId: string;
  profileIds: string[];
  metricResults: Array<{ metric: string; value: number; threshold: number; passed: boolean }>;
  failures: string[];
  disclosures: string[];
  approvalId?: string;
  promotionDecision?: 'approved' | 'rejected' | 'deferred';
  rollbackDecisionId?: string;
  immutable: boolean;
  createdAt: string;
  approvedAt?: string;
}
