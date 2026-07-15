/**
 * Plan regeneration — preserves history when plan changes.
 */
export interface PlanRegeneration {
  id: string;
  planId: string;
  previousVersion: number;
  newVersion: number;
  reason: 'target-score-change' | 'exam-date-change' | 'progress-adaptation' | 'content-update';
  previousPlanSnapshot: string;
  generatedAt: string;
}

/**
 * Progress adaptation — adjusts plan based on completed activities.
 */
export interface ProgressAdaptation {
  id: string;
  planId: string;
  completedActivityIds: string[];
  adaptedAt: string;
  changes: AdaptationChange[];
}

export interface AdaptationChange {
  activityId: string;
  changeType: 'added' | 'removed' | 'rescheduled' | 'modified';
  reason: string;
}
