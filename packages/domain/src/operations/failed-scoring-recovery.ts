export function canRecoverScoring(originalResponsePreserved: boolean): boolean {
  return originalResponsePreserved;
}

export function recoveryResultType(isRescore: boolean): 'retry' | 'rescore' {
  return isRescore ? 'rescore' : 'retry';
}
