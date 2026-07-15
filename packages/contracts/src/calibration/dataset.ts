export interface CalibrationDataset {
  id: string;
  version: number;
  taskType: string;
  sampleReferences: string[];
  expertReviewStatus: 'pending' | 'in-progress' | 'completed';
  provenance: string;
  activationStatus: 'inactive' | 'active' | 'retired';
  intendedUse: string;
  exclusions?: string[];
  subgroupMetadataPolicy: string;
  createdById: string;
  approvedById?: string;
  createdAt: string;
  activatedAt?: string;
  immutable: boolean;
}
