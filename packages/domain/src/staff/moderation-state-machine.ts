import type { ModerationCase } from '@pte-app/contracts';

type ModerationTransition = { from: string; to: string }[];

const transitions: ModerationTransition = [
  { from: 'open', to: 'triaged' },
  { from: 'triaged', to: 'in-progress' },
  { from: 'in-progress', to: 'resolved' },
  { from: 'in-progress', to: 'closed' },
  { from: 'resolved', to: 'closed' },
  { from: 'closed', to: 'open' },
];

export function canTransitionModeration(from: string, to: string): boolean {
  return transitions.some((t) => t.from === from && t.to === to);
}

export function createModerationCase(subjectType: string, subjectId: string, reporterId: string): ModerationCase {
  return {
    id: crypto.randomUUID(),
    subjectType,
    subjectId,
    evidenceReferences: [],
    status: 'open',
    assignment: { moderatorId: '', assignedAt: '' },
    auditTrail: [{ action: 'created', timestamp: new Date().toISOString(), actorId: reporterId }],
    reversible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
