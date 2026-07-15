export interface MediaRepairRequest {
  id: string;
  originalMediaId: string;
  originalPreserved: boolean;
  repairAction: string;
  outputMediaId?: string;
  integrityReference?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  replacementRelationship?: string;
  status: 'requested' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
