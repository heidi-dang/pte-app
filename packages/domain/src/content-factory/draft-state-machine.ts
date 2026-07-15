import type { ContentLifecycleState } from '@pte-app/contracts';

const transitions: Record<ContentLifecycleState, ContentLifecycleState[]> = {
  draft: ['imported', 'generating-assistance', 'ready-for-validation', 'archived'],
  imported: ['ready-for-validation', 'archived'],
  'generating-assistance': ['ready-for-validation', 'draft'],
  'ready-for-validation': ['validating', 'draft'],
  validating: ['validation-failed', 'ready-for-review'],
  'validation-failed': ['ready-for-validation', 'draft', 'archived'],
  'ready-for-review': ['in-review', 'draft'],
  'in-review': ['changes-requested', 'approved', 'rejected'],
  'changes-requested': ['ready-for-review', 'draft'],
  approved: ['publication-queued'],
  'publication-queued': ['published'],
  published: ['retired'],
  retired: ['archived'],
  rejected: ['archived', 'draft'],
  archived: [],
};

export function canTransition(from: ContentLifecycleState, to: ContentLifecycleState): boolean {
  return transitions[from]?.includes(to) ?? false;
}
