import type { BatchOperation } from '@pte-app/contracts';
export async function executeBatchPublication(batch: BatchOperation): Promise<void> {
  if (batch.status !== 'running') return;
}
