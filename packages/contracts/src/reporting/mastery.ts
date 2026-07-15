import type { MasteryId, MasterySnapshotId } from './identifiers.js';
import type { DataFreshnessStatus } from './data-freshness.js';

export interface MasteryEvidence {
  attemptId: string;
  resultId: string;
  questionVersionId: string;
  taskId: string;
  taskType: string;
  taskName: string;
  skillId: string;
  skillName: string;
  estimatedTrainingScore: number;
  confidence: number;
  scoringProfileId: string;
  scoringProfileVersion: number;
  evaluationProfileId: string | null;
  evaluationProfileVersion: number | null;
  completenessStatus: 'complete' | 'partial' | 'failed';
  timestamp: string;
}

export interface EvidencePolicy {
  completeResultPolicy: 'include';
  partialResultPolicy: 'include' | 'discount' | 'exclude';
  failedResultPolicy: 'exclude' | 'include-with-disclosure';
  minimumEvidence: number;
  minimumConfidence: number;
  scoreNormalisationPolicy: 'none' | 'z-score' | 'linear';
  confidenceWeightingPolicy: 'none' | 'weighted';
}

export type MasteryLevelStatus = 'insufficient' | 'partial' | 'sufficient';

export type MasteryLevel =
  | {
      skillId: string;
      skillName: string;
      status: 'insufficient';
      level: null;
      confidence: 0;
      evidenceCount: number;
      minimumRequired: number;
      lastUpdated: string;
      contributingAttempts: MasteryEvidence[];
      totalEvidence: number;
      eligibleEvidence: number;
      partialEvidence: number;
      failedEvidence: number;
      excludedEvidence: number;
    }
  | {
      skillId: string;
      skillName: string;
      status: 'partial' | 'sufficient';
      level: number;
      confidence: number;
      evidenceCount: number;
      minimumRequired: number;
      lastUpdated: string;
      contributingAttempts: MasteryEvidence[];
      totalEvidence: number;
      eligibleEvidence: number;
      partialEvidence: number;
      failedEvidence: number;
      excludedEvidence: number;
    };

export interface MasteryProfile {
  id: MasteryId;
  version: number;
  evidencePolicy: EvidencePolicy;
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
