import { z } from 'zod';
import { ActivityItemSchema } from './activity.schema.js';

export const DashboardSchema = z.object({
  id: z.string(),
  userId: z.string(),
  reportProfileId: z.string(),
  latestStudyPlanProgress: z
    .object({
      completedActivities: z.number().int().min(0),
      totalActivities: z.number().int().min(0),
      percentage: z.number().min(0).max(100),
      updatedAt: z.string(),
    })
    .nullable(),
  recentActivity: z.array(ActivityItemSchema),
  latestResults: z.array(
    z.object({
      resultId: z.string(),
      taskType: z.string(),
      estimatedScore: z.number(),
      classification: z.string(),
      createdAt: z.string(),
    }),
  ),
  currentWeaknesses: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      weaknesses: z.array(
        z.object({
          skillId: z.string(),
          skillName: z.string(),
          score: z.number(),
          gap: z.number(),
          priority: z.enum(['high', 'medium', 'low']),
          evidence: z.string(),
          reason: z.string(),
        }),
      ),
      insufficientEvidence: z.boolean(),
      createdAt: z.string(),
      profileVersion: z.number().int(),
      reportVersion: z.number().int(),
    }),
  ),
  pendingProcessing: z.number().int().min(0),
  failedProcessing: z.number().int().min(0),
  staleDataIndicator: z.boolean(),
  links: z.record(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StudentDashboardSchema = z.object({
  id: z.string(),
  userId: z.string(),
  latestStudyPlanProgress: DashboardSchema.shape.latestStudyPlanProgress,
  recentActivity: z.array(ActivityItemSchema),
  latestResults: DashboardSchema.shape.latestResults,
  currentWeaknesses: DashboardSchema.shape.currentWeaknesses,
  pendingProcessing: z.number().int().min(0),
  failedProcessing: z.number().int().min(0),
  staleDataIndicator: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
