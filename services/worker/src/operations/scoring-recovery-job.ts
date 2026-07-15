import type { ScoringRecoveryRequest } from '@pte-app/contracts';
export async function executeScoringRecovery(request: ScoringRecoveryRequest): Promise<void> {
  if (request.status !== 'requested') return;
}
