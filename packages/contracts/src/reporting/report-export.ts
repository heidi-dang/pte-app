import type { ReportExportId } from './identifiers.js';
import type { ReportFilter } from './report-filter.js';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportRequest {
  filter: ReportFilter;
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
}

export interface ExportJob {
  id: ReportExportId;
  userId: string;
  request: ExportRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface ExportManifest {
  id: string;
  exportJobId: ReportExportId;
  format: ExportFormat;
  rowCount: number;
  checksum: string;
  artifactUrl: string;
  generatedAt: string;
  expiresAt: string;
}
