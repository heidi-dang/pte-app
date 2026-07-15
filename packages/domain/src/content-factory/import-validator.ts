export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateImportRow(row: Record<string, unknown>, requiredFields: string[]): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
