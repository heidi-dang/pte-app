import { QuestionSessionId, QuestionVersionId, ResponseRevision } from './identifiers';

export type ResponseState = 'empty' | 'incomplete' | 'complete' | 'submitted';

export interface QuestionResponseEnvelope<TResponse = unknown> {
  sessionId: QuestionSessionId;
  questionVersionId: QuestionVersionId;
  questionType: string;
  revision: ResponseRevision;
  state: ResponseState;
  response: TResponse;
  updatedAt: string;
}
