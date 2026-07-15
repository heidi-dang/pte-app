import type { MediaProcessingJob } from '@pte-app/contracts';
export async function processMedia(job: MediaProcessingJob): Promise<void> {
  if (job.status !== 'queued') return;
}
