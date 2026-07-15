export interface PublicationGateCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export function evaluatePublicationGate(checks: PublicationGateCheck[]): { passed: boolean; failures: string[] } {
  const failures = checks.filter((c) => !c.passed).map((c) => c.message ?? c.name);
  return { passed: failures.length === 0, failures };
}

export function publicationGateRequiredChecks(): string[] {
  return [
    'provenance',
    'validation',
    'duplicates-resolved',
    'media-ready',
    'human-review',
    'self-approval-policy',
    'version-immutable',
  ];
}
