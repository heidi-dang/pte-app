import type { RetentionJob } from '@pte-app/contracts';
export async function executeRetention(job: RetentionJob): Promise<void> {
  if (job.status !== 'running') return;
}
