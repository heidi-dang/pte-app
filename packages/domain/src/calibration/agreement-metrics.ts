import type { AgreementMetrics } from '@pte-app/contracts';

export function calculateAgreement(
  reviewerScores: number[],
  referenceScores: number[],
  tolerance: number,
): AgreementMetrics {
  if (reviewerScores.length === 0 || referenceScores.length === 0 || reviewerScores.length !== referenceScores.length) {
    return {
      absoluteAgreement: 0,
      toleranceAgreement: 0,
      traitAgreement: {},
      disagreementDistribution: {},
      sampleCount: 0,
      missingData: true,
      insufficientData: true,
    };
  }

  let absoluteMatches = 0;
  let toleranceMatches = 0;
  for (let i = 0; i < reviewerScores.length; i++) {
    const ref = referenceScores[i] as number;
    if (reviewerScores[i] === ref) absoluteMatches++;
    if (Math.abs((reviewerScores[i] as number) - ref) <= tolerance) toleranceMatches++;
  }

  return {
    absoluteAgreement: absoluteMatches / reviewerScores.length,
    toleranceAgreement: toleranceMatches / reviewerScores.length,
    traitAgreement: {},
    disagreementDistribution: {},
    sampleCount: reviewerScores.length,
    insufficientData: reviewerScores.length < 5,
    missingData: false,
  };
}
