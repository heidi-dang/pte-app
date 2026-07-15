export interface SubgroupDefinition {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  version: number;
  authorised: boolean;
}

export interface SubgroupAnalysisResult {
  subgroupId: string;
  subgroupName: string;
  sampleSize: number;
  meanScore: number;
  confidence: number;
  effectSize?: number;
  baselineMean: number;
  significant: boolean;
  disclosed: boolean;
}

export interface BiasAnalysisResult {
  id: string;
  datasetId: string;
  profileVersion: number;
  subgroups: SubgroupAnalysisResult[];
  warnings: string[];
  minGroupSize: number;
  privacySafe: boolean;
  createdAt: string;
}
