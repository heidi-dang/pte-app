import { z } from 'zod';

export const MockBlueprintSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  testType: z.enum(['full-mock', 'section-test']),
  sectionOrder: z.array(z.string()),
  taskDistribution: z.array(
    z.object({
      section: z.string(),
      taskType: z.string(),
      count: z.number().int().min(1),
      difficultyRange: z.tuple([z.number(), z.number()]),
    }),
  ),
  taskQuantityRules: z.object({
    minPerSection: z.number().int().min(1),
    maxPerSection: z.number().int().min(1),
    totalTasks: z.number().int().min(1),
  }),
  selectionPolicy: z.object({
    method: z.enum(['random', 'stratified', 'adaptive']),
    seed: z.number().optional(),
  }),
  timingProfileId: z.string(),
  playbackProfiles: z.record(z.string()),
  recordingProfiles: z.record(z.string()),
  scoringProfiles: z.record(z.string()),
  evaluationProfiles: z.record(z.string()),
  noResponsePolicy: z.object({
    penaliseUnanswered: z.boolean(),
    allowPartialSubmission: z.boolean(),
  }),
  navigationPolicy: z.object({
    allowFreeNavigation: z.boolean(),
    allowSectionRevisit: z.boolean(),
    showProgressBar: z.boolean(),
  }),
});

export const MockSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.number().int().min(1),
  serverDeadline: z.string(),
  currentSection: z.string(),
  currentTaskPosition: z.number().int().min(0),
  selectedQuestions: z.array(
    z.object({
      questionId: z.string(),
      questionVersionId: z.string(),
      taskType: z.string(),
      section: z.string(),
      position: z.number().int().min(0),
    }),
  ),
  responses: z.array(
    z.object({
      questionVersionId: z.string(),
      sessionQuestionId: z.string(),
      responseId: z.string(),
      revision: z.number().int().min(0),
    }),
  ),
  playbackState: z.record(
    z.object({
      consumedPlays: z.number().int().min(0),
      allowedPlays: z.number().int().min(0),
    }),
  ),
  recordingState: z.record(
    z.object({
      recordingId: z.string().optional(),
      state: z.string(),
    }),
  ),
  progress: z.object({
    completedTasks: z.number().int().min(0),
    totalTasks: z.number().int().min(1),
    currentSectionTasks: z.number().int().min(0),
    totalSectionTasks: z.number().int().min(1),
  }),
  submissionState: z.object({
    submitted: z.boolean(),
    idempotencyKey: z.string().optional(),
    submittedAt: z.string().optional(),
  }),
  scoringWorkflow: z.object({
    state: z.enum(['idle', 'queued', 'scoring', 'completed', 'failed']),
    jobId: z.string().optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
  }),
  resultId: z.string().optional(),
  state: z.enum([
    'created',
    'ready',
    'active',
    'section-transition',
    'submitting',
    'submitted',
    'scoring-queued',
    'scoring',
    'result-building',
    'completed',
    'expired',
    'failed-recoverable',
    'failed-terminal',
    'abandoned',
  ]),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  expiredAt: z.string().optional(),
});

export const MockResultSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.number().int().min(1),
  resultClassification: z.literal('estimated-training-result'),
  sectionScores: z.array(
    z.object({
      section: z.string(),
      score: z.number(),
      totalQuestions: z.number().int().min(0),
      answeredQuestions: z.number().int().min(0),
      taskTypeScores: z.record(z.number()),
    }),
  ),
  overallScore: z.number(),
  scoringProfileVersions: z.record(z.number()),
  evaluationProfileVersions: z.record(z.number()),
  isComplete: z.boolean(),
  missingComponents: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  componentEvidence: z.array(
    z.object({
      section: z.string(),
      taskType: z.string(),
      questionVersionId: z.string(),
      score: z.number(),
      evidence: z.string(),
    }),
  ),
  createdAt: z.string(),
});
