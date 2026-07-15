export interface OperationsDashboard {
  totalUsers: number;
  activeSessions: number;
  pendingScoringJobs: number;
  failedScoringJobs: number;
  openSupportCases: number;
  openModerationCases: number;
  activeImpersonations: number;
  pendingConfirmations: number;
  systemStatus: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}
