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
    const observedAgreement =
      sampleCount > 0 ? indices.filter((x) => Math.abs(x.p - outcomes[x.i]) <= 0.1).length / sampleCount : 0;
    return { label: b.label, predictedMin: b.min, predictedMax: b.max, observedAgreement, sampleCount };
  });
}
