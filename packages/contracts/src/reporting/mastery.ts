import type { MasteryId, MasterySnapshotId } from './identifiers.js';
import type { DataFreshnessStatus } from './data-freshness.js';

export type MasterySubject =
  | { subjectType: 'skill'; subjectId: string; subjectName: string }
  | { subjectType: 'task'; subjectId: string; subjectName: string; taskType: string };

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

export type InclusionReason =
  'complete-included' | 'partial-included' | 'partial-discounted' | 'failed-included-with-disclosure';

export type ProfileCompatibility =
  | { status: 'matched' }
  | {
      status: 'included-with-disclosure';
      mismatches: Array<
        | 'scoring-profile-id'
        | 'scoring-profile-version'
        | 'evaluation-profile-id'
        | 'evaluation-profile-version'
        | 'evaluation-profile-missing'
      >;
    };

export interface WeightedContribution {
  evidence: MasteryEvidence;
  appliedWeight: number;
  weightedScore: number;
  inclusionReason: InclusionReason;
  profileCompatibility: ProfileCompatibility;
}

export type ScoreNormalisationPolicy =
  | { method: 'none' }
  | { method: 'linear'; inputMinimum: number; inputMaximum: number; outputMinimum: number; outputMaximum: number }
  | { method: 'z-score'; referenceMean: number; referenceStandardDeviation: number };

export interface EvidencePolicy {
  completeResultPolicy: 'include';
  partialResultPolicy: 'include' | 'discount' | 'exclude';
  partialResultWeight: number;
  failedResultPolicy: 'exclude' | 'include-with-disclosure';
  failedResultWeight: number;
  minimumEvidence: number;
  minimumConfidence: number;
  scoreNormalisationPolicy: ScoreNormalisationPolicy;
  confidenceWeightingPolicy: 'none' | 'weighted';
  referenceScoringProfileId: string | null;
  referenceScoringProfileVersion: number | null;
  referenceEvaluationProfileId: string | null;
  referenceEvaluationProfileVersion: number | null;
  allowedScoringProfileIds: string[];
  allowedScoringProfileVersions: number[];
  allowedEvaluationProfileIds: string[];
  allowedEvaluationProfileVersions: number[];
  mixedProfilePolicy: 'allow' | 'exclude-mismatched' | 'disclose-mismatched';
}

export interface MasteryLevelDefinition {
  id: string;
  label: string;
  value: number;
  threshold: number;
}

export type MasteryLevelStatus = 'insufficient' | 'partial' | 'sufficient';

export interface ExcludedEvidence {
  evidence: MasteryEvidence;
  reason:
    | 'partial-policy-excluded'
    | 'failed-policy-excluded'
    | 'zero-weight-policy-excluded'
    | 'invalid-profile-version'
    | 'incompatible-result-profile'
    | 'missing-required-field'
    | 'missing-reference-evaluation-profile'
    | 'malformed-identity';
}

export interface UnassignedMasteryEvidence {
  evidence: MasteryEvidence;
  intendedMasteryType: 'skill' | 'task';
  reason: 'malformed-identity' | 'missing-required-field';
  missingFields: string[];
}

export type MasteryLevel =
  | {
      subject: MasterySubject;
      status: 'insufficient';
      level: null;
      confidence: 0;
      evidenceCount: number;
      minimumRequired: number;
      lastUpdated: string;
      contributingEvidence: WeightedContribution[];
      excludedEvidence: ExcludedEvidence[];
      totalEvidence: number;
      eligibleEvidence: number;
      partialEvidence: number;
      failedEvidence: number;
      excludedEvidenceCount: number;
      warnings: string[];
    }
  | {
      subject: MasterySubject;
      status: 'partial' | 'sufficient';
      level: number;
      confidence: number;
      evidenceCount: number;
      minimumRequired: number;
      lastUpdated: string;
      contributingEvidence: WeightedContribution[];
      excludedEvidence: ExcludedEvidence[];
      totalEvidence: number;
      eligibleEvidence: number;
      partialEvidence: number;
      failedEvidence: number;
      excludedEvidenceCount: number;
      warnings: string[];
    };

export interface MasteryProfile {
  id: MasteryId;
  version: number;
  evidencePolicy: EvidencePolicy;
  levelDefinitions: MasteryLevelDefinition[];
  staleDataThresholdDays: number;
  fallbackLevel: number | null;
}

export interface MasterySnapshot {
  id: MasterySnapshotId;
  profileId: MasteryId;
  profileVersion: number;
  userId: string;
  levels: MasteryLevel[];
  unassignedEvidence: UnassignedMasteryEvidence[];
  calculatedAt: string;
  dataFreshness: DataFreshnessStatus;
  partialData: boolean;
  warnings: string[];
  masteryType: 'skill' | 'task';
}
