import type { QuestionSession, QuestionResponseEnvelope, SubmissionResult } from '@pte-app/contracts';

export function serializeSession(session: QuestionSession): Record<string, unknown> {
  return {
    id: session.id,
    mode: session.mode,
    state: session.state,
    createdAt: session.createdAt,
    startedAt: session.startedAt,
    pausedAt: session.pausedAt,
    submittedAt: session.submittedAt,
    expiredAt: session.expiredAt,
    abandonedAt: session.abandonedAt,
    updatedAt: session.updatedAt,
  };
}

export function serializeResponse(envelope: QuestionResponseEnvelope): Record<string, unknown> {
  // Staging safe fields, ensuring no correct answers or protected transcripts are leaked
  return {
    sessionId: envelope.sessionId,
    questionVersionId: envelope.questionVersionId,
    questionType: envelope.questionType,
    revision: envelope.revision,
    state: envelope.state,
    response: envelope.response,
    updatedAt: envelope.updatedAt,
  };
}

export function serializeSubmission(result: SubmissionResult): Record<string, unknown> {
  return {
    submissionId: result.submissionId,
    sessionId: result.sessionId,
    questionVersionId: result.questionVersionId,
    status: result.status,
    idempotencyKey: result.idempotencyKey,
    submittedAt: result.submittedAt,
  };
}
