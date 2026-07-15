export interface AuditExportJob {
  id: string;
  filters: Record<string, unknown>;
  requestedById: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultArtifactId?: string;
  expiresAt?: string;
  checksum?: string;
  createdAt: string;
}
