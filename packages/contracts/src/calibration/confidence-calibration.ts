export interface ConfidenceCalibrationBucket {
  bucketLabel: string;
  predictedMin: number;
  predictedMax: number;
  observedAgreement: number;
  sampleCount: number;
}

export interface ConfidenceCalibrationResult {
  id: string;
  profileId: string;
  profileVersion: number;
  buckets: ConfidenceCalibrationBucket[];
  underconfidence: number;
  overconfidence: number;
  insufficientData: boolean;
  createdAt: string;
}
