import { z } from 'zod';

const NonEmpty = z.string().min(1);
const PositiveInt = z.number().int().min(1);

export const MasterySubjectSchema: z.ZodType<unknown> = z.discriminatedUnion('subjectType', [
  z.object({ subjectType: z.literal('skill'), subjectId: NonEmpty, subjectName: NonEmpty }),
  z.object({ subjectType: z.literal('task'), subjectId: NonEmpty, subjectName: NonEmpty, taskType: NonEmpty }),
]);

export const MasteryEvidenceSchema = z.object({
  attemptId: z.string(),
  resultId: z.string(),
  questionVersionId: z.string(),
  taskId: z.string(),
  taskType: z.string(),
  taskName: z.string(),
  skillId: z.string(),
  skillName: z.string(),
  estimatedTrainingScore: z.number(),
  confidence: z.number().min(0).max(1),
  scoringProfileId: z.string(),
  scoringProfileVersion: PositiveInt,
  evaluationProfileId: z.string().nullable(),
  evaluationProfileVersion: z.number().int().nullable(),
  completenessStatus: z.enum(['complete', 'partial', 'failed']),
  timestamp: z.string(),
});

const ProfileCompatibilitySchema: z.ZodType<unknown> = z.discriminatedUnion('status', [
  z.object({ status: z.literal('matched') }),
  z.object({
    status: z.literal('included-with-disclosure'),
    mismatches: z
      .array(
        z.enum([
          'scoring-profile-id',
          'scoring-profile-version',
          'evaluation-profile-id',
          'evaluation-profile-version',
          'evaluation-profile-missing',
        ]),
      )
      .min(1),
  }),
]);

export const WeightedContributionSchema = z.object({
  evidence: MasteryEvidenceSchema,
  appliedWeight: z.number().gt(0),
  weightedScore: z.number(),
  inclusionReason: z.enum([
    'complete-included',
    'partial-included',
    'partial-discounted',
    'failed-included-with-disclosure',
  ]),
  profileCompatibility: ProfileCompatibilitySchema,
});

export const ScoreNormalisationPolicySchema: z.ZodType<unknown> = z.discriminatedUnion('method', [
  z.object({ method: z.literal('none') }),
  z.object({
    method: z.literal('linear'),
    inputMinimum: z.number(),
    inputMaximum: z.number(),
    outputMinimum: z.number(),
    outputMaximum: z.number(),
  }),
  z.object({
    method: z.literal('z-score'),
    referenceMean: z.number(),
    referenceStandardDeviation: z.number().positive(),
  }),
]);

export const EvidencePolicySchema = z
  .object({
    completeResultPolicy: z.literal('include'),
    partialResultPolicy: z.enum(['include', 'discount', 'exclude']),
    partialResultWeight: z.number().min(0).max(1),
    failedResultPolicy: z.enum(['exclude', 'include-with-disclosure']),
    failedResultWeight: z.number().min(0).max(1),
    minimumEvidence: PositiveInt,
    minimumConfidence: z.number().min(0).max(1),
    scoreNormalisationPolicy: ScoreNormalisationPolicySchema,
    confidenceWeightingPolicy: z.enum(['none', 'weighted']),
    referenceScoringProfileId: z.string().nullable(),
    referenceScoringProfileVersion: z.number().int().nullable(),
    referenceEvaluationProfileId: z.string().nullable(),
    referenceEvaluationProfileVersion: z.number().int().nullable(),
    allowedScoringProfileIds: z.array(z.string()),
    allowedScoringProfileVersions: z.array(PositiveInt),
    allowedEvaluationProfileIds: z.array(z.string()),
    allowedEvaluationProfileVersions: z.array(z.number().int()),
    mixedProfilePolicy: z.enum(['allow', 'exclude-mismatched', 'disclose-mismatched']),
  })
  .refine(
    (d) => {
      if (d.referenceScoringProfileId !== null && d.referenceScoringProfileVersion === null) return false;
      if (d.referenceScoringProfileVersion !== null && d.referenceScoringProfileId === null) return false;
      return true;
    },
    { message: 'referenceScoringProfileId and referenceScoringProfileVersion must be supplied together' },
  )
  .refine(
    (d) => {
      if (d.referenceEvaluationProfileId !== null && d.referenceEvaluationProfileVersion === null) return false;
      if (d.referenceEvaluationProfileVersion !== null && d.referenceEvaluationProfileId === null) return false;
      return true;
    },
    { message: 'referenceEvaluationProfileId and referenceEvaluationProfileVersion must be supplied together' },
  )
  .refine(
    (d) => {
      if (
        (d.mixedProfilePolicy === 'exclude-mismatched' || d.mixedProfilePolicy === 'disclose-mismatched') &&
        d.referenceScoringProfileId === null &&
        d.referenceScoringProfileVersion === null &&
        d.referenceEvaluationProfileId === null &&
        d.referenceEvaluationProfileVersion === null
      )
        return false;
      return true;
    },
    { message: 'exclude-mismatched and disclose-mismatched require at least one complete reference pair' },
  )
  .refine(
    (d) => {
      if (d.referenceScoringProfileVersion !== null && d.referenceScoringProfileVersion <= 0) return false;
      if (d.referenceEvaluationProfileVersion !== null && d.referenceEvaluationProfileVersion <= 0) return false;
      return true;
    },
    { message: 'reference versions must be positive integers' },
  );

export const MasteryLevelDefinitionSchema = z.object({
  id: NonEmpty,
  label: NonEmpty,
  value: z.number().int().min(0),
  threshold: z.number().min(0).max(1),
});

export const ExcludedEvidenceSchema = z.object({
  evidence: MasteryEvidenceSchema,
  reason: z.enum([
    'partial-policy-excluded',
    'failed-policy-excluded',
    'zero-weight-policy-excluded',
    'invalid-profile-version',
    'incompatible-result-profile',
    'missing-required-field',
    'missing-reference-evaluation-profile',
    'malformed-identity',
  ]),
});

export const UnassignedMasteryEvidenceSchema = z.object({
  evidence: MasteryEvidenceSchema,
  intendedMasteryType: z.enum(['skill', 'task']),
  reason: z.enum(['malformed-identity', 'missing-required-field']),
  missingFields: z.array(z.string()).min(1),
});

const InsufficientLevelSchema = z.object({
  subject: MasterySubjectSchema,
  status: z.literal('insufficient'),
  level: z.null(),
  confidence: z.literal(0),
  evidenceCount: z.number().int().min(0),
  minimumRequired: PositiveInt,
  lastUpdated: z.string().or(z.literal('')),
  contributingEvidence: z.array(WeightedContributionSchema),
  excludedEvidence: z.array(ExcludedEvidenceSchema),
  totalEvidence: z.number().int().min(0),
  eligibleEvidence: z.number().int().min(0),
  partialEvidence: z.number().int().min(0),
  failedEvidence: z.number().int().min(0),
  excludedEvidenceCount: z.number().int().min(0),
  warnings: z.array(z.string()),
});

const PartialSufficientLevelSchema = z.object({
  subject: MasterySubjectSchema,
  status: z.enum(['partial', 'sufficient']),
  level: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().min(0),
  minimumRequired: PositiveInt,
  lastUpdated: z.string().or(z.literal('')),
  contributingEvidence: z.array(WeightedContributionSchema),
  excludedEvidence: z.array(ExcludedEvidenceSchema),
  totalEvidence: z.number().int().min(0),
  eligibleEvidence: z.number().int().min(0),
  partialEvidence: z.number().int().min(0),
  failedEvidence: z.number().int().min(0),
  excludedEvidenceCount: z.number().int().min(0),
  warnings: z.array(z.string()),
});

export const MasteryLevelSchema: z.ZodType<unknown> = z.discriminatedUnion('status', [
  InsufficientLevelSchema,
  PartialSufficientLevelSchema,
]);

export const MasteryProfileSchema = z.object({
  id: NonEmpty,
  version: PositiveInt,
  evidencePolicy: EvidencePolicySchema,
  levelDefinitions: z.array(MasteryLevelDefinitionSchema),
  staleDataThresholdDays: PositiveInt,
  fallbackLevel: z.number().int().min(0).nullable(),
});

export const MasterySnapshotSchema = z.object({
  id: NonEmpty,
  profileId: NonEmpty,
  profileVersion: PositiveInt,
  userId: NonEmpty,
  levels: z.array(MasteryLevelSchema),
  unassignedEvidence: z.array(UnassignedMasteryEvidenceSchema),
  calculatedAt: NonEmpty,
  dataFreshness: z.enum(['fresh', 'stale', 'unknown']),
  partialData: z.boolean(),
  warnings: z.array(z.string()),
  masteryType: z.enum(['skill', 'task']),
});
