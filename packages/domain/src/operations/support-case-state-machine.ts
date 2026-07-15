import type { SupportCaseState } from '@pte-app/contracts';

const transitions: Record<SupportCaseState, SupportCaseState[]> = {
  open: ['triaged', 'closed'],
  triaged: ['in-progress', 'waiting-for-internal', 'closed'],
  'in-progress': ['waiting-for-student', 'waiting-for-internal', 'resolved', 'closed'],
  'waiting-for-student': ['in-progress', 'closed'],
  'waiting-for-internal': ['in-progress', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['triaged', 'in-progress'],
};

export function canTransition(state: SupportCaseState, target: SupportCaseState): boolean {
  return transitions[state]?.includes(target) ?? false;
}
