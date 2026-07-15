import { QuestionEventId, QuestionSessionId, EventSequence } from './identifiers';

export type QuestionProgressEventType =
  | 'session.created'
  | 'session.started'
  | 'session.paused'
  | 'session.resumed'
  | 'session.recovered'
  | 'response.save-started'
  | 'response.saved'
  | 'response.save-failed'
  | 'timer.warning'
  | 'timer.expired'
  | 'playback.ready'
  | 'playback.started'
  | 'playback.consumed'
  | 'playback.completed'
  | 'playback.failed'
  | 'submission.started'
  | 'submission.completed'
  | 'submission.failed'
  | 'session.abandoned';

export interface QuestionSessionEvent<TPayload = unknown> {
  id: QuestionEventId;
  sessionId: QuestionSessionId;
  sequence: EventSequence;
  type: QuestionProgressEventType;
  payload: TPayload;
  occurredAt: string;
  actorId?: string;
}
