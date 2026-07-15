import type { ExportRequest, ExportJob, ExportManifest, ReportExportId } from '@pte-app/contracts';

export function createExportJob(userId: string, request: ExportRequest): ExportJob {
  return {
    id: crypto.randomUUID() as ReportExportId,
    userId,
    request,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString(),
  };
}

export function buildExportManifest(
  exportJobId: ReportExportId,
  format: string,
  rowCount: number,
  checksum: string,
  artifactUrl: string,
  expiresAt: string,
): ExportManifest {
  return {
    id: crypto.randomUUID() as ReportExportId,
    exportJobId,
    format: format as any,
    rowCount,
    checksum,
    artifactUrl,
    generatedAt: new Date().toISOString(),
    expiresAt,
  };
}
