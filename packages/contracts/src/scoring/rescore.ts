/**
 * Rescore request — creates a new result without mutating the original.
 */
export interface RescoreRequest {
  originalResultId: string;
  questionVersionId: string;
  scoringProfileId: string;
  scoringProfileVersion: number;
  reason: string;
}
