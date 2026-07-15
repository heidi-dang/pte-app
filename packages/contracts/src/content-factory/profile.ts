import type { DuplicateDetectionProfile } from './duplicate-detection.js';
import type { QualityProfile } from './quality-score.js';

export interface ContentFactoryProfile {
  id: string;
  version: number;
  duplicateDetection: DuplicateDetectionProfile;
  qualityProfile: QualityProfile;
  requireProvenance: boolean;
  requireHumanReview: boolean;
  preventSelfApproval: boolean;
  batchSizeLimit: number;
}
