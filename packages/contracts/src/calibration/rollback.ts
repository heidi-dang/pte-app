export interface ProfileRollbackDecision {
  id: string;
  profileId: string;
  candidateVersion: number;
  originalVersion: number;
  reason: string;
  affectedResultIds: string[];
  silentOverwrite: boolean;
  decidedById: string;
  decidedAt: string;
}
