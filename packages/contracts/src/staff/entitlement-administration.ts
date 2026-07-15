export interface EntitlementAdjustmentRequest {
  id: string;
  userId: string;
  requestedChange: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmationRequired: boolean;
  confirmedAt?: string;
  confirmedById?: string;
  auditEventId?: string;
  createdAt: string;
}
