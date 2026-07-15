import type { MasteryId, MasterySnapshotId } from './identifiers.js';
import type { DataFreshnessStatus } from './data-freshness.js';

export interface AttemptReference {
  resultId: string;
  questionVersionId: string;
  taskType: string;
  completedAt: string;
  estimatedScore: number;
}

export interface MasteryLevel {
  skillId: string;
  skillName: string;
  level: number;
  confidence: number;
  evidenceCount: number;
  minimumRequired: number;
  status: 'sufficient' | 'insufficient' | 'partial';
  lastUpdated: string;
  contributingAttempts: AttemptReference[];
}

export interface MasteryProfile {
  id: MasteryId;
  version: number;
  minimumEvidence: number;
  minimumConfidence: number;
  levelDefinitions: Record<string, { threshold: number; label: string }>;
  staleDataThresholdDays: number;
}

export interface MasterySnapshot {
  id: MasterySnapshotId;
  profileId: MasteryId;
  profileVersion: number;
  userId: string;
  levels: MasteryLevel[];
  calculatedAt: string;
  dataFreshness: DataFreshnessStatus;
  partialData: boolean;
  warnings: string[];
}
