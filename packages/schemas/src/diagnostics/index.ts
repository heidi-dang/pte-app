import { z } from 'zod';

export const DiagnosticBlueprintSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  includedSkills: z.array(
    z.object({
      skillId: z.string(),
      name: z.string(),
      description: z.string(),
      weight: z.number(),
    }),
  ),
  taskDistribution: z.array(
    z.object({
      taskType: z.string(),
      section: z.string(),
      count: z.number().int().min(1),
      difficultyRange: z.tuple([z.number(), z.number()]),
    }),
  ),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(1),
    medium: z.number().min(0).max(1),
    hard: z.number().min(0).max(1),
  }),
  selectionPolicy: z.object({
    method: z.enum(['random', 'stratified', 'adaptive']),
    seed: z.number().optional(),
  }),
  minimumEvidence: z.number().int().min(1),
  partialResultPolicy: z.object({
    allowPartialResults: z.boolean(),
    minimumCompletedTasks: z.number().int().min(1),
    confidenceThreshold: z.number().min(0).max(1),
  }),
  scoringProfileReferences: z.array(z.string()),
  estimatedResultMapping: z.array(
    z.object({
      scoreRange: z.tuple([z.number(), z.number()]),
      estimatedLevel: z.string(),
    }),
  ),
});

export const DiagnosticSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.number().int().min(1),
  state: z.enum(['created', 'active', 'completed', 'partial', 'expired']),
  selectedQuestions: z.array(
    z.object({
      questionId: z.string(),
      questionVersionId: z.string(),
      taskType: z.string(),
      section: z.string(),
      difficulty: z.number(),
      position: z.number().int().min(0),
    }),
  ),
  completedTasks: z.number().int().min(0),
  totalTasks: z.number().int().min(1),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  partialResultId: z.string().optional(),
});

export const SkillProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  diagnosticSessionId: z.string(),
  skills: z.array(
    z.object({
      skillId: z.string(),
      estimatedScore: z.number(),
      confidence: z.number().min(0).max(1),
      evidenceCount: z.number().int().min(0),
      isWeakness: z.boolean(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  missingEvidence: z.array(z.string()),
  weaknessRationale: z.string(),
  createdAt: z.string(),
});
