import type { StudyPlan, PlanRegeneration } from '@pte-app/contracts';

/**
 * Regeneration — creates a new plan version preserving history.
 */
export function regeneratePlan(
  currentPlan: StudyPlan,
  reason: PlanRegeneration['reason'],
  newConfig: Partial<Pick<StudyPlan, 'examDate' | 'availableStudyDays' | 'sessionDurationMinutes'>>,
): { plan: StudyPlan; regeneration: PlanRegeneration } {
  const newPlan: StudyPlan = {
    ...currentPlan,
    version: currentPlan.version + 1,
    planVersion: currentPlan.planVersion + 1,
    regenerationReason: reason,
    examDate: newConfig.examDate ?? currentPlan.examDate,
    availableStudyDays: newConfig.availableStudyDays ?? currentPlan.availableStudyDays,
    sessionDurationMinutes: newConfig.sessionDurationMinutes ?? currentPlan.sessionDurationMinutes,
    createdAt: new Date().toISOString(),
  };

  const regeneration: PlanRegeneration = {
    id: `regen_${Date.now()}`,
    planId: currentPlan.id,
    previousVersion: currentPlan.version,
    newVersion: newPlan.version,
    reason,
    previousPlanSnapshot: JSON.stringify(currentPlan),
    generatedAt: new Date().toISOString(),
  };

  return { plan: newPlan, regeneration };
}
