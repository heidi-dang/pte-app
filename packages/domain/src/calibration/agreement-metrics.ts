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

  const absoluteMatches = reviewerScores.filter((s, i) => s === referenceScores[i]).length;
  const toleranceMatches = reviewerScores.filter((s, i) => Math.abs(s - referenceScores[i]) <= tolerance).length;

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
