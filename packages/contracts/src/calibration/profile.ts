import type { AgreementProfile } from './agreement.js';

export interface CalibrationProfile {
  id: string;
  version: number;
  agreement: AgreementProfile;
  minimumSamples: number;
  biasMinGroupSize: number;
  driftThreshold: number;
  confidenceBuckets: Array<{ label: string; min: number; max: number }>;
  promotionRequirements: string[];
}
