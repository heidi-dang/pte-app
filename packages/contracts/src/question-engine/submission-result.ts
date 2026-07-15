import { QuestionSubmissionId, QuestionSessionId, QuestionVersionId, IdempotencyKey } from './identifiers';

export type SubmissionStatus = 'accepted' | 'rejected' | 'duplicate';

export interface SubmissionResult {
  submissionId: QuestionSubmissionId;
  sessionId: QuestionSessionId;
  questionVersionId: QuestionVersionId;
  status: SubmissionStatus;
  idempotencyKey: IdempotencyKey;
  submittedAt: string;
}
