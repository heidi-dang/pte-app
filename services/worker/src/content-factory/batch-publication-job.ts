import type { BatchOperation } from '@pte-app/contracts';
export async function executeBatchPublication(_batch: BatchOperation): Promise<void> {
  if (batch.status !== 'running') return;
}
