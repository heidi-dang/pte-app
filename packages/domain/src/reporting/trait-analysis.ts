import type { TraitResult, TraitAnalysis, TraitAnalysisId } from '@pte-app/contracts';

export function buildTraitAnalysis(
  userId: string,
  evaluationResultId: string,
  traits: TraitResult[],
  missingTraits: string[] = [],
): TraitAnalysis {
  const warnings: string[] = [];

  if (missingTraits.length > 0) {
    warnings.push(`Missing traits: ${missingTraits.join(', ')}`);
  }

  const automated = traits.filter((t) => t.evidenceType === 'automated');
  if (automated.length > 0) {
    warnings.push(`Contains ${automated.length} automated trait(s) — not human-reviewed`);
  }

  const lowConfidence = traits.filter((t) => t.confidence < 0.5);
  if (lowConfidence.length > 0) {
    warnings.push(`${lowConfidence.length} trait(s) have low confidence (< 0.5)`);
  }

  return {
    id: crypto.randomUUID() as TraitAnalysisId,
    userId,
    evaluationResultId,
    traits,
    missingTraits,
    warnings,
    createdAt: new Date().toISOString(),
  };
}
