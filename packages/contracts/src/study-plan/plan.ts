/**
 * Study plan — personalised learning plan.
 */
export interface StudyPlan {
  id: string;
  userId: string;
  diagnosticReportId: string;
  version: number;
  /** Daily activities. */
  dailyActivities: DailyActivity[];
  /** Weekly goals. */
  weeklyGoals: WeeklyGoal[];
  /** Target score gap. */
  targetScoreGap: number;
  /** Exam date. */
  examDate: string;
  /** Available study days per week. */
  availableStudyDays: number;
  /** Session duration profile (minutes). */
  sessionDurationMinutes: number;
  /** Content references. */
  contentReferences: ContentReference[];
  /** Priority skills. */
  prioritySkills: string[];
  /** Plan version. */
  planVersion: number;
  /** Regeneration reason. */
  regenerationReason?: string;
  createdAt: string;
}

export interface DailyActivity {
  dayOfWeek: string;
  activities: Activity[];
  estimatedMinutes: number;
}

export interface Activity {
  activityId: string;
  taskType: string;
  skillId: string;
  contentReference: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface WeeklyGoal {
  weekNumber: number;
  targetSkillScores: Record<string, number>;
  activitiesPlanned: number;
}

export interface ContentReference {
  contentId: string;
  questionVersionId: string;
  taskType: string;
  available: boolean;
}
