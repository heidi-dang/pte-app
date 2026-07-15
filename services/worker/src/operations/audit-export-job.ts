import type { AuditExportJob } from '@pte-app/contracts';
export async function processAuditExport(job: AuditExportJob): Promise<void> {
  if (job.status !== 'queued') return;
}
