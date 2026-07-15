// packages/contracts/src/question-engine/question-version.ts

import { QuestionVersionId, QuestionId } from './identifiers';

export interface QuestionVersion {
  id: QuestionVersionId;
  questionId: QuestionId;
  versionNumber: number;
  contentVersionId: string; // could be a branded type later
  type: string; // e.g., 'reading-multiple-choice-single-answer'
  contractVersion: string;
}
