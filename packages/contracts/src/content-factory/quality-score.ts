export interface QualityProfile {
  id: string;
  version: number;
  components: Record<string, { weight: number; required: boolean; threshold: number }>;
}

export interface QualityScore {
  contentId: string;
  profileId: string;
  profileVersion: number;
  componentScores: Record<string, number>;
  overallScore: number;
  failedRequirements: string[];
  snapshotAt: string;
}
