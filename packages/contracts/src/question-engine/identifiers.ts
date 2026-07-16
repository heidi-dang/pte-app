// packages/contracts/src/question-engine/identifiers.ts
// Branded identifier types for the universal question engine.

export type QuestionId = string & { __brand: 'QuestionId' };
export type QuestionVersionId = string & { __brand: 'QuestionVersionId' };
export type QuestionSessionId = string & { __brand: 'QuestionSessionId' };
export type QuestionResponseId = string & { __brand: 'QuestionResponseId' };
export type QuestionSubmissionId = string & { __brand: 'QuestionSubmissionId' };
export type QuestionEventId = string & { __brand: 'QuestionEventId' };
export type PlaybackRightId = string & { __brand: 'PlaybackRightId' };
export type TimingProfileId = string & { __brand: 'TimingProfileId' };
export type PlaybackProfileId = string & { __brand: 'PlaybackProfileId' };
export type ScoringProfileId = string & { __brand: 'ScoringProfileId' };
export type IdempotencyKey = string & { __brand: 'IdempotencyKey' };
export type ResponseRevision = number & { __brand: 'ResponseRevision' };
export type EventSequence = number & { __brand: 'EventSequence' };
