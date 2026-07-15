export interface ContentProvenanceRecord {
  id: string;
  contentVersionId: string;
  sourceType: 'original' | 'imported' | 'generated' | 'adapted';
  sourceReference?: string;
  licenceStatus: 'valid' | 'expired' | 'unknown';
  creatorDeclaration: string;
  reviewerConfirmation: boolean;
  createdAt: string;
}

export interface ProvenanceGateResult {
  passed: boolean;
  blocks: Array<{ reason: string; field: string }>;
  warnings: string[];
}
