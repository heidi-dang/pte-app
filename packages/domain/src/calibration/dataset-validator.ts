export interface DatasetValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDatasetSamples(sampleCount: number, minimumRequired: number): DatasetValidationResult {
  const errors: string[] = [];
  if (sampleCount < minimumRequired) errors.push(`Sample count ${sampleCount} below minimum ${minimumRequired}`);
  return { valid: errors.length === 0, errors };
}
