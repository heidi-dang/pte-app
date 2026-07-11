/**
 * Progress-event interface.
 *
 * Emitted during long-running operations so the UI can display progress.
 */

export interface ProgressEvent {
  readonly jobId: string;
  readonly stage: string;
  readonly progress: number; // 0-100
  readonly message?: string;
  readonly timestamp: string;
}

export type ProgressListener = (event: ProgressEvent) => void;

export interface ProgressEmitter {
  onProgress(listener: ProgressListener): void;
  emit(event: ProgressEvent): void;
}

export function createProgressEvent(jobId: string, stage: string, progress: number, message?: string): ProgressEvent {
  return { jobId, stage, progress, message, timestamp: new Date().toISOString() };
}
