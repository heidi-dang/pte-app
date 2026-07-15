export interface PublicationCommand {
  id: string;
  contentVersionId: string;
  targetCatalogue: string;
  effectiveDate: string;
  idempotencyKey: string;
  status: 'queued' | 'published' | 'failed';
  publishedAt?: string;
  rollbackState?: string;
}
