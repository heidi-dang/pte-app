import type { SessionContract, SessionStatus } from '@pte-app/contracts';
import type { SessionId, ExamId, UserId, QuestionId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Session {
  readonly id: SessionId;
  readonly version: Version;
  readonly examId: ExamId;
  readonly userId: UserId;
  readonly status: SessionStatus;
  readonly startedAt: ISO8601DateTime;
  readonly expiresAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
  readonly currentTaskIndex: number;
  readonly answers: ReadonlyArray<QuestionId>;
  readonly metadata: Record<string, unknown>;
}

export function createSession(contract: SessionContract): Session {
  return {
    id: contract.id,
    version: contract.version,
    examId: contract.examId,
    userId: contract.userId,
    status: contract.status,
    startedAt: contract.startedAt,
    expiresAt: contract.expiresAt,
    completedAt: contract.completedAt,
    currentTaskIndex: contract.currentTaskIndex,
    answers: contract.answers,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function sessionIsActive(session: Session): boolean {
  return session.status === 'active';
}

export function sessionIsCompleted(session: Session): boolean {
  return session.status === 'completed';
}

export function sessionIsTerminal(session: Session): boolean {
  return session.status === 'completed' || session.status === 'expired' || session.status === 'abandoned';
}
