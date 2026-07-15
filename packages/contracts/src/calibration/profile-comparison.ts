export interface ProfileComparison {
  id: string;
  datasetId: string;
  baselineProfile: { id: string; version: number };
  candidateProfile: { id: string; version: number };
  overallDelta: number;
  traitDeltas: Record<string, number>;
  regressions: string[];
  improvements: string[];
  inconclusive: boolean;
  confidence: number;
  createdAt: string;
}
