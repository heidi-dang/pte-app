export interface CalibrationBucket {
  label: string;
  predictedMin: number;
  predictedMax: number;
  observedAgreement: number;
  sampleCount: number;
}

export function calculateCalibrationBuckets(
  predictions: number[],
  outcomes: number[],
  buckets: Array<{ label: string; min: number; max: number }>,
): CalibrationBucket[] {
  return buckets.map((b) => {
    const indices = predictions.map((p, i) => ({ p, i })).filter((x) => x.p >= b.min && x.p <= b.max);
    const sampleCount = indices.length;
    let agreementCount = 0;
    for (const x of indices) {
      const outcome = outcomes[x.i] as number;
      if (Math.abs(x.p - outcome) <= 0.1) agreementCount++;
    }
    const observedAgreement = sampleCount > 0 ? agreementCount / sampleCount : 0;
    return { label: b.label, predictedMin: b.min, predictedMax: b.max, observedAgreement, sampleCount };
  });
}
