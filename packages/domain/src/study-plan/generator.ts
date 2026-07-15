import type { DiagnosticReport, StudyPlan, ContentReference } from '@pte-app/contracts';

/**
 * Study plan generator — creates plan from diagnostic report.
 */
export function generateStudyPlan(
  report: DiagnosticReport,
  config: {
    examDate: string;
    availableStudyDays: number;
    sessionDurationMinutes: number;
    availableContent: ContentReference[];
  },
): StudyPlan {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const activeDays = daysOfWeek.slice(0, config.availableStudyDays);

  const dailyActivities = activeDays.map((day) => ({
    dayOfWeek: day,
    activities: report.weaknesses.slice(0, 2).map((w, i) => ({
      activityId: `act_${day}_${i}`,
      taskType: 'practice',
      skillId: w.skillId,
      contentReference: config.availableContent[i % config.availableContent.length]?.contentId ?? '',
      estimatedMinutes: Math.floor(config.sessionDurationMinutes / 2),
      priority: w.priority,
      completed: false,
    })),
    estimatedMinutes: config.sessionDurationMinutes,
  }));

  return {
    id: `plan_${Date.now()}`,
    userId: report.userId,
    diagnosticReportId: report.id,
    version: 1,
    dailyActivities,
    weeklyGoals: [
      {
        weekNumber: 1,
        targetSkillScores: Object.fromEntries(report.targetGaps.map((g) => [g.skillId, g.targetScore])),
        activitiesPlanned: dailyActivities.reduce((sum, d) => sum + d.activities.length, 0),
      },
    ],
    targetScoreGap: report.targetGaps.reduce((sum, g) => sum + g.gap, 0),
    examDate: config.examDate,
    availableStudyDays: config.availableStudyDays,
    sessionDurationMinutes: config.sessionDurationMinutes,
    contentReferences: config.availableContent,
    prioritySkills: report.weaknesses.filter((w) => w.priority === 'high').map((w) => w.skillId),
    planVersion: 1,
    createdAt: new Date().toISOString(),
  };
}
