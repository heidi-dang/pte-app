import type { SensitiveActionConfirmation } from '@pte-app/contracts';

export function createConfirmation(
  actionType: string,
  reason: string,
  expectedState: Record<string, unknown>,
  idempotencyKey: string,
  ttlMs: number,
): SensitiveActionConfirmation {
  return {
    id: crypto.randomUUID(),
    actionType,
    reason,
    expectedTargetState: expectedState,
    idempotencyKey,
    status: 'pending',
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function isConfirmationStale(conf: SensitiveActionConfirmation): boolean {
  return new Date(conf.expiresAt) < new Date();
}
