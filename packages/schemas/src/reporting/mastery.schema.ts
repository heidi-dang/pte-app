import { z } from 'zod';

const NonEmpty = z.string().min(1);
const PositiveInt = z.number().int().min(1);

// Raw evidence schema — accepts potentially empty fields for malformed input
export const RawMasteryEvidenceSchema = z.object({
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
  scoringProfileVersion: z.number().int().min(0),
  evaluationProfileId: z.string().nullable(),
  evaluationProfileVersion: z.number().int().nullable(),
  completenessStatus: z.enum(['complete', 'partial', 'failed']),
  timestamp: z.string(),
});

// Valid evidence schema — strict non-empty for all identity fields, positive versions
export const ValidMasteryEvidenceSchema = z
  .object({
    attemptId: NonEmpty,
    resultId: NonEmpty,
    questionVersionId: NonEmpty,
    taskId: NonEmpty,
    taskType: NonEmpty,
    taskName: NonEmpty,
    skillId: NonEmpty,
    skillName: NonEmpty,
    estimatedTrainingScore: z.number(),
    confidence: z.number().min(0).max(1),
    scoringProfileId: NonEmpty,
    scoringProfileVersion: PositiveInt,
    evaluationProfileId: z.string().nullable(),
    evaluationProfileVersion: z.number().int().nullable(),
    completenessStatus: z.enum(['complete', 'partial', 'failed']),
    timestamp: NonEmpty,
  })
  .refine(
    (d) => {
      if (d.evaluationProfileId !== null && d.evaluationProfileVersion === null) return false;
      if (d.evaluationProfileId === null && d.evaluationProfileVersion !== null) return false;
      return true;
    },
    { message: 'evaluationProfileId and evaluationProfileVersion must be supplied together' },
  );

export const MasterySubjectSchema: z.ZodType<unknown> = z.discriminatedUnion('subjectType', [
  z.object({ subjectType: z.literal('skill'), subjectId: NonEmpty, subjectName: NonEmpty }),
  z.object({ subjectType: z.literal('task'), subjectId: NonEmpty, subjectName: NonEmpty, taskType: NonEmpty }),
]);

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

// Weighted contribution uses validated evidence
export const WeightedContributionSchema = z.object({
  evidence: ValidMasteryEvidenceSchema,
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

const LinearNormalisationSchema = z.object({
  method: z.literal('linear'),
  direction: z.enum(['ascending', 'descending']),
  inputMinimum: z.number(),
  inputMaximum: z.number(),
  outputMinimum: z.number(),
  outputMaximum: z.number(),
});

export const ScoreNormalisationPolicySchema = z
  .discriminatedUnion('method', [
    z.object({ method: z.literal('none') }),
    LinearNormalisationSchema,
    z.object({
      method: z.literal('z-score'),
      referenceMean: z.number(),
      referenceStandardDeviation: z.number().positive(),
    }),
  ])
  .superRefine((d, ctx) => {
    if (d.method !== 'linear') return;
    if (d.inputMaximum <= d.inputMinimum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inputMaximum must be greater than inputMinimum',
        path: ['inputMaximum'],
      });
    }
    if (d.direction === 'ascending' && d.outputMaximum <= d.outputMinimum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ascending requires outputMaximum > outputMinimum',
        path: ['outputMaximum'],
      });
    }
    if (d.direction === 'descending' && d.outputMaximum >= d.outputMinimum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'descending requires outputMaximum < outputMinimum',
        path: ['outputMaximum'],
      });
    }
  });

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
    referenceScoringProfileId: NonEmpty.nullable(),
    referenceScoringProfileVersion: PositiveInt.nullable(),
    referenceEvaluationProfileId: NonEmpty.nullable(),
    referenceEvaluationProfileVersion: PositiveInt.nullable(),
    allowedScoringProfileIds: z.array(z.string()),
    allowedScoringProfileVersions: z.array(PositiveInt),
    allowedEvaluationProfileIds: z.array(z.string()),
    allowedEvaluationProfileVersions: z.array(PositiveInt),
    mixedProfilePolicy: z.enum(['allow', 'exclude-mismatched', 'disclose-mismatched']),
  })
  .refine(
    (d) => {
      if (d.referenceScoringProfileId !== null && d.referenceScoringProfileVersion === null) return false;
      if (d.referenceScoringProfileVersion !== null && d.referenceScoringProfileId === null) return false;
      return true;
    },
    { message: 'referenceScoringProfileId and referenceScoringProfileVersion must be both null or both non-null' },
  )
  .refine(
    (d) => {
      if (d.referenceEvaluationProfileId !== null && d.referenceEvaluationProfileVersion === null) return false;
      if (d.referenceEvaluationProfileVersion !== null && d.referenceEvaluationProfileId === null) return false;
      return true;
    },
    {
      message: 'referenceEvaluationProfileId and referenceEvaluationProfileVersion must be both null or both non-null',
    },
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
    { message: 'mixed profile policies require at least one complete reference pair' },
  );

export const MasteryLevelDefinitionSchema = z.object({
  id: NonEmpty,
  label: NonEmpty,
  value: z.number().int().min(0),
  threshold: z.number().min(0).max(1),
});

export const ExcludedEvidenceSchema = z.object({
  evidence: ValidMasteryEvidenceSchema,
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

// Unassigned evidence uses raw schema — malformed input must remain recoverable
export const UnassignedMasteryEvidenceSchema = z.object({
  evidence: RawMasteryEvidenceSchema,
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
