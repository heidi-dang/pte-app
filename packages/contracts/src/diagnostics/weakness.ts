/**
 * Weakness detection and target-gap analysis.
 */
export interface Weakness {
  skillId: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  recommendedActivities: string[];
}

export interface TargetGap {
  skillId: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  examDate: string;
  studyDaysAvailable: number;
}
