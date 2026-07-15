import type { ScoringSupportAction } from '@pte-app/contracts';

export function createScoringSupportAction(
  jobId: string,
  action: ScoringSupportAction['action'],
  reason: string,
  actorId: string,
): ScoringSupportAction {
  return {
    id: crypto.randomUUID(),
    jobId,
    action,
    status: 'requested',
    originalResponsePreserved: true,
    reason,
    actorId,
    createdAt: new Date().toISOString(),
  };
}
