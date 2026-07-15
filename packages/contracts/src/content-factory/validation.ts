export interface ValidationRun {
  id: string;
  contentId: string;
  version: number;
  checks: Array<{ name: string; passed: boolean; message?: string }>;
  status: 'queued' | 'running' | 'passed' | 'failed';
  startedAt: string;
  completedAt?: string;
}
