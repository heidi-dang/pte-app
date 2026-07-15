import type { EntitlementAdjustmentRequest } from '@pte-app/contracts';

export function createEntitlementAdjustmentRequest(
  userId: string,
  requestedChange: Record<string, unknown>,
  reason: string,
): EntitlementAdjustmentRequest {
  return {
    id: crypto.randomUUID(),
    userId,
    requestedChange,
    reason,
    status: 'pending',
    confirmationRequired: true,
    createdAt: new Date().toISOString(),
  };
}

export function confirmAdjustmentRequest(
  request: EntitlementAdjustmentRequest,
  confirmedById: string,
): EntitlementAdjustmentRequest {
  return { ...request, status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedById };
}
