export function validateRestorationPlan(
  prerequisites: string[],
  completedSteps: string[],
): { ready: boolean; missing: string[] } {
  const missing = prerequisites.filter((p) => !completedSteps.includes(p));
  return { ready: missing.length === 0, missing };
}
