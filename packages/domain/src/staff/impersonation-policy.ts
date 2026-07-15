import type { ImpersonationSession } from '@pte-app/contracts';

export function canStartImpersonation(
  configEnabled: boolean,
  hasCapability: boolean,
): { allowed: boolean; reason?: string } {
  if (!configEnabled) return { allowed: false, reason: 'Impersonation is disabled by configuration' };
  if (!hasCapability) return { allowed: false, reason: 'Caller lacks impersonation capability' };
  return { allowed: true };
}

export function isImpersonationExpired(session: ImpersonationSession): boolean {
  return new Date(session.expiresAt) < new Date();
}
