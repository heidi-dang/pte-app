export interface EffectivenessResult {
  improved: boolean;
  delta: number;
  classification: 'observational' | 'controlled' | 'inconclusive';
}

export function evaluateEffectiveness(
  beforeScore: number,
  afterScore: number,
  hasControl: boolean,
): EffectivenessResult {
  const delta = afterScore - beforeScore;
  return {
    improved: delta > 0,
    delta,
    classification: hasControl ? 'controlled' : 'observational',
  };
}
