import type { ScoringProfileId } from '../question-engine/identifiers.js';

/**
 * Versioned scoring profile — controls all objective scoring behaviour.
 */
export interface ScoringProfile {
  id: ScoringProfileId;
  version: number;
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
  /** Rounding policy. */
  rounding: RoundingPolicy;
  /** Normalisation policy. */
  normalisation: NormalisationConfig;
  /** No-response behaviour. */
  noResponseBehaviour: NoResponseBehaviour;
}

export interface RoundingPolicy {
  method: 'none' | 'floor' | 'ceil' | 'round';
  decimalPlaces: number;
}

export interface NormalisationConfig {
  enabled: boolean;
  method: 'none' | 'linear' | 'z-score';
  referenceMean?: number;
  referenceStdDev?: number;
}

export interface NoResponseBehaviour {
  result: number;
  reason: 'profile-default' | 'penalty' | 'zero';
}
