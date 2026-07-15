export interface ValidationCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export function runValidationChecks(checks: ValidationCheck[]): { passed: boolean; results: ValidationCheck[] } {
  const allPassed = checks.every((c) => c.passed);
  return { passed: allPassed, results: checks };
}
