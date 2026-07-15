import type { ImportJob } from '@pte-app/contracts';
export async function processImportJob(job: ImportJob): Promise<void> {
  if (job.status !== 'queued') return;
}
