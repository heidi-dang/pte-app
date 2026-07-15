import type { TraitAnalysisId } from './identifiers.js';

export interface TraitResult {
  traitId: string;
  traitName: string;
  score: number;
  confidence: number;
  sourceProfileVersion: number;
  sourceProviderId?: string;
  evidenceType: 'human-reviewed' | 'automated';
  metadata?: Record<string, unknown>;
}

export interface TraitAnalysis {
  id: TraitAnalysisId;
  userId: string;
  taskType?: string;
  evaluationResultId: string;
  traits: TraitResult[];
  missingTraits: string[];
  warnings: string[];
  createdAt: string;
}
