export interface AgreementMetrics {
  absoluteAgreement: number;
  toleranceAgreement: number;
  rankCorrelation?: number;
  traitAgreement: Record<string, number>;
  disagreementDistribution: Record<string, number>;
  sampleCount: number;
  confidenceInterval?: [number, number];
  missingData: boolean;
  insufficientData: boolean;
}

export interface AgreementProfile {
  id: string;
  version: number;
  tolerance: number;
  minimumSamples: number;
  minimumAgreement: number;
}
