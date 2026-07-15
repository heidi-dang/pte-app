import type { MockSessionState } from '@pte-app/contracts';

const MOCK_TRANSITIONS: Record<MockSessionState, readonly MockSessionState[]> = {
  created: ['ready', 'abandoned'],
  ready: ['active', 'abandoned'],
  active: ['section-transition', 'submitting', 'expired', 'failed-recoverable', 'abandoned'],
  'section-transition': ['active', 'submitting', 'expired'],
  submitting: ['submitted', 'failed-recoverable', 'failed-terminal'],
  submitted: ['scoring-queued', 'completed', 'expired'],
  'scoring-queued': ['scoring', 'failed-recoverable'],
  scoring: ['result-building', 'failed-recoverable'],
  'result-building': ['completed', 'failed-recoverable'],
  completed: [],
  expired: ['submitting', 'scoring-queued'],
  'failed-recoverable': ['active', 'submitting', 'scoring-queued'],
  'failed-terminal': [],
  abandoned: [],
};

export function canTransitionMock(from: MockSessionState, to: MockSessionState): boolean {
  return MOCK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionMock(from: MockSessionState, to: MockSessionState): MockSessionState {
  if (!canTransitionMock(from, to)) {
    throw new Error(`Invalid mock session transition: ${from} → ${to}`);
  }
  return to;
}

export function isTerminalMockState(state: MockSessionState): boolean {
  return state === 'completed' || state === 'failed-terminal' || state === 'abandoned';
}
