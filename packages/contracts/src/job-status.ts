/**
 * Background-job status interface.
 */

export type JobStatus = 'queued' | 'started' | 'progress' | 'retrying' | 'completed' | 'failed';

export interface BackgroundJob {
  readonly id: string;
  readonly type: string;
  readonly status: JobStatus;
  readonly progress?: number; // 0-100
  readonly stage?: string;
  readonly payload: Record<string, unknown>;
  readonly result?: unknown;
  readonly error?: { code?: string; message: string };
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly correlationId?: string;
}
