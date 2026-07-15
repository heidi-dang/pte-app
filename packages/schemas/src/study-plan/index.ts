import { z } from 'zod';

export const StudyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  diagnosticReportId: z.string(),
  version: z.number().int().min(1),
  dailyActivities: z.array(
    z.object({
      dayOfWeek: z.string(),
      activities: z.array(
        z.object({
          activityId: z.string(),
          taskType: z.string(),
          skillId: z.string(),
          contentReference: z.string(),
          estimatedMinutes: z.number().int().min(1),
          priority: z.enum(['high', 'medium', 'low']),
          completed: z.boolean(),
        }),
      ),
      estimatedMinutes: z.number().int().min(1),
    }),
  ),
  weeklyGoals: z.array(
    z.object({
      weekNumber: z.number().int().min(1),
      targetSkillScores: z.record(z.number()),
      activitiesPlanned: z.number().int().min(0),
    }),
  ),
  targetScoreGap: z.number(),
  examDate: z.string(),
  availableStudyDays: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(1),
  contentReferences: z.array(
    z.object({
      contentId: z.string(),
      questionVersionId: z.string(),
      taskType: z.string(),
      available: z.boolean(),
    }),
  ),
  prioritySkills: z.array(z.string()),
  planVersion: z.number().int().min(1),
  regenerationReason: z.string().optional(),
  createdAt: z.string(),
});

export const PlanRegenerationSchema = z.object({
  id: z.string(),
  planId: z.string(),
  previousVersion: z.number().int().min(1),
  newVersion: z.number().int().min(1),
  reason: z.enum(['target-score-change', 'exam-date-change', 'progress-adaptation', 'content-update']),
  previousPlanSnapshot: z.string(),
  generatedAt: z.string(),
});
