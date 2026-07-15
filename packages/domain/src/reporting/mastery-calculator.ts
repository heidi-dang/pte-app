import type {
  MasteryProfile,
  MasteryLevel,
  MasterySnapshot,
  MasterySnapshotId,
  MasteryId,
  MasteryEvidence,
  EvidencePolicy,
  ScoreNormalisationPolicy,
  ExcludedEvidence,
  MasterySubject,
  WeightedContribution,
  InclusionReason,
  ProfileCompatibility,
  UnassignedMasteryEvidence,
} from '@pte-app/contracts';

export class MasteryValidationError extends Error {
  code: 'INVALID_LINEAR_NORMALISATION_RANGE' | 'INVALID_Z_SCORE_STANDARD_DEVIATION' | 'NO_MASTERY_LEVEL_MATCH';
  constructor(code: MasteryValidationError['code'], message: string) {
    super(message);
    this.name = 'MasteryValidationError';
    this.code = code;
  }
}

function validateNormalisationPolicy(policy: ScoreNormalisationPolicy): void {
  if (policy.method === 'linear' && policy.inputMaximum <= policy.inputMinimum) {
    throw new MasteryValidationError(
      'INVALID_LINEAR_NORMALISATION_RANGE',
      'inputMaximum must be greater than inputMinimum',
    );
  }
  if (policy.method === 'z-score' && policy.referenceStandardDeviation <= 0) {
    throw new MasteryValidationError(
      'INVALID_Z_SCORE_STANDARD_DEVIATION',
      'referenceStandardDeviation must be greater than zero',
    );
  }
}

function normaliseScore(value: number, policy: ScoreNormalisationPolicy): number {
  validateNormalisationPolicy(policy);
  switch (policy.method) {
    case 'none':
      return value;
    case 'linear': {
      const range = policy.inputMaximum - policy.inputMinimum;
      return (
        policy.outputMinimum + ((value - policy.inputMinimum) / range) * (policy.outputMaximum - policy.outputMinimum)
      );
    }
    case 'z-score':
      return (value - policy.referenceMean) / policy.referenceStandardDeviation;
  }
}

function inclusionReasonFor(evidence: MasteryEvidence, policy: EvidencePolicy): InclusionReason {
  if (evidence.completenessStatus === 'failed') return 'failed-included-with-disclosure';
  if (evidence.completenessStatus === 'partial')
    return policy.partialResultPolicy === 'discount' ? 'partial-discounted' : 'partial-included';
  return 'complete-included';
}

function computeProfileCompatibility(e: MasteryEvidence, policy: EvidencePolicy): ProfileCompatibility {
  if (policy.mixedProfilePolicy !== 'disclose-mismatched') return { status: 'matched' };
  const mismatches: Array<
    | 'scoring-profile-id'
    | 'scoring-profile-version'
    | 'evaluation-profile-id'
    | 'evaluation-profile-version'
    | 'evaluation-profile-missing'
  > = [];
  if (policy.referenceScoringProfileId !== null && e.scoringProfileId !== policy.referenceScoringProfileId)
    mismatches.push('scoring-profile-id');
  if (
    policy.referenceScoringProfileVersion !== null &&
    e.scoringProfileVersion !== policy.referenceScoringProfileVersion
  )
    mismatches.push('scoring-profile-version');
  if (
    policy.referenceEvaluationProfileId !== null &&
    e.evaluationProfileId !== null &&
    e.evaluationProfileId !== policy.referenceEvaluationProfileId
  )
    mismatches.push('evaluation-profile-id');
  if (
    policy.referenceEvaluationProfileVersion !== null &&
    e.evaluationProfileVersion !== null &&
    e.evaluationProfileVersion !== policy.referenceEvaluationProfileVersion
  )
    mismatches.push('evaluation-profile-version');
  if (policy.referenceEvaluationProfileId !== null && e.evaluationProfileId === null)
    mismatches.push('evaluation-profile-missing');
  if (mismatches.length > 0) return { status: 'included-with-disclosure', mismatches } as ProfileCompatibility;
  return { status: 'matched' } as ProfileCompatibility;
}

function isCompatible(
  e: MasteryEvidence,
  policy: EvidencePolicy,
): { compatible: boolean; reason?: ExcludedEvidence['reason'] } {
  if (policy.allowedScoringProfileIds.length > 0 && !policy.allowedScoringProfileIds.includes(e.scoringProfileId))
    return { compatible: false, reason: 'incompatible-result-profile' };
  if (
    policy.allowedScoringProfileVersions.length > 0 &&
    !policy.allowedScoringProfileVersions.includes(e.scoringProfileVersion)
  )
    return { compatible: false, reason: 'invalid-profile-version' };
  if (
    e.evaluationProfileId &&
    policy.allowedEvaluationProfileIds.length > 0 &&
    !policy.allowedEvaluationProfileIds.includes(e.evaluationProfileId)
  )
    return { compatible: false, reason: 'incompatible-result-profile' };
  if (
    e.evaluationProfileVersion !== null &&
    policy.allowedEvaluationProfileVersions.length > 0 &&
    !policy.allowedEvaluationProfileVersions.includes(e.evaluationProfileVersion)
  )
    return { compatible: false, reason: 'invalid-profile-version' };

  if (policy.mixedProfilePolicy === 'exclude-mismatched') {
    if (policy.referenceScoringProfileId !== null && e.scoringProfileId !== policy.referenceScoringProfileId)
      return { compatible: false, reason: 'incompatible-result-profile' };
    if (
      policy.referenceScoringProfileVersion !== null &&
      e.scoringProfileVersion !== policy.referenceScoringProfileVersion
    )
      return { compatible: false, reason: 'invalid-profile-version' };
    if (
      policy.referenceEvaluationProfileId !== null &&
      e.evaluationProfileId !== null &&
      e.evaluationProfileId !== policy.referenceEvaluationProfileId
    )
      return { compatible: false, reason: 'incompatible-result-profile' };
    if (
      policy.referenceEvaluationProfileVersion !== null &&
      e.evaluationProfileVersion !== null &&
      e.evaluationProfileVersion !== policy.referenceEvaluationProfileVersion
    )
      return { compatible: false, reason: 'invalid-profile-version' };
    if (policy.referenceEvaluationProfileId !== null && e.evaluationProfileId === null)
      return { compatible: false, reason: 'missing-reference-evaluation-profile' };
  }
  return { compatible: true };
}

function isSkillEvidenceValid(e: MasteryEvidence): boolean {
  return !!(e.skillId && e.skillName && e.questionVersionId && e.attemptId && e.resultId);
}

function isTaskEvidenceValid(e: MasteryEvidence): boolean {
  return !!(e.taskId && e.taskType && e.taskName && e.questionVersionId && e.attemptId && e.resultId);
}

function missingSkillFields(e: MasteryEvidence): string[] {
  const f: string[] = [];
  if (!e.skillId) f.push('skillId');
  if (!e.skillName) f.push('skillName');
  if (!e.questionVersionId) f.push('questionVersionId');
  if (!e.attemptId) f.push('attemptId');
  if (!e.resultId) f.push('resultId');
  return f;
}

function missingTaskFields(e: MasteryEvidence): string[] {
  const f: string[] = [];
  if (!e.taskId) f.push('taskId');
  if (!e.taskType) f.push('taskType');
  if (!e.taskName) f.push('taskName');
  if (!e.questionVersionId) f.push('questionVersionId');
  if (!e.attemptId) f.push('attemptId');
  if (!e.resultId) f.push('resultId');
  return f;
}

function validateEvidence(e: MasteryEvidence): boolean {
  return !!(
    e.attemptId &&
    e.resultId &&
    e.questionVersionId &&
    e.taskId &&
    e.taskType &&
    e.skillId &&
    e.scoringProfileId &&
    e.timestamp
  );
}

function classifyEvidence(
  e: MasteryEvidence,
  policy: EvidencePolicy,
): { eligible: boolean; weight: number; excludedReason?: ExcludedEvidence['reason'] } {
  if (!validateEvidence(e)) return { eligible: false, excludedReason: 'missing-required-field', weight: 0 };
  if (e.completenessStatus === 'failed') {
    if (policy.failedResultPolicy === 'include-with-disclosure')
      return { eligible: true, weight: policy.failedResultWeight };
    return { eligible: false, excludedReason: 'failed-policy-excluded', weight: 0 };
  }
  if (e.completenessStatus === 'partial') {
    if (policy.partialResultPolicy === 'exclude')
      return { eligible: false, excludedReason: 'partial-policy-excluded', weight: 0 };
    return { eligible: true, weight: policy.partialResultPolicy === 'discount' ? policy.partialResultWeight : 1 };
  }
  return { eligible: true, weight: 1 };
}

function evaluateEvidence(
  evidence: MasteryEvidence[],
  policy: EvidencePolicy,
): {
  weightedSum: number;
  totalAppliedWeight: number;
  weightedConfidenceSum: number;
  contributions: WeightedContribution[];
  excluded: ExcludedEvidence[];
  eligibleCount: number;
  partialCount: number;
  failedCount: number;
  hasDisclosedMismatch: boolean;
} {
  const contributions: WeightedContribution[] = [];
  const excluded: ExcludedEvidence[] = [];
  let eligibleCount = 0,
    partialCount = 0,
    failedCount = 0;
  let weightedSum = 0,
    totalAppliedWeight = 0,
    weightedConfidenceSum = 0;
  let hasDisclosedMismatch = false;

  for (const e of evidence) {
    if (e.completenessStatus === 'partial') partialCount++;
    if (e.completenessStatus === 'failed') failedCount++;

    const compat = isCompatible(e, policy);
    if (!compat.compatible) {
      excluded.push({ evidence: e, reason: compat.reason ?? 'missing-required-field' });
      continue;
    }

    const pc = computeProfileCompatibility(e, policy);
    if (pc.status === 'included-with-disclosure') hasDisclosedMismatch = true;

    const cls = classifyEvidence(e, policy);
    if (cls.eligible) {
      const w = cls.weight;
      if (w === 0) {
        excluded.push({ evidence: e, reason: 'zero-weight-policy-excluded' });
        continue;
      }
      eligibleCount++;
      const ws = e.estimatedTrainingScore * w;
      weightedSum += ws;
      totalAppliedWeight += w;
      weightedConfidenceSum += e.confidence * w;
      contributions.push({
        evidence: e,
        appliedWeight: w,
        weightedScore: ws,
        inclusionReason: inclusionReasonFor(e, policy),
        profileCompatibility: pc,
      });
    } else if (cls.excludedReason) {
      excluded.push({ evidence: e, reason: cls.excludedReason });
    }
  }
  return {
    weightedSum,
    totalAppliedWeight,
    weightedConfidenceSum,
    contributions,
    excluded,
    eligibleCount,
    partialCount,
    failedCount,
    hasDisclosedMismatch,
  };
}

function computeLevel(profile: MasteryProfile, subject: MasterySubject, items: MasteryEvidence[]): MasteryLevel {
  const policy = profile.evidencePolicy;
  const totalEvidence = items.length;
  const warnings: string[] = [];
  const {
    weightedSum,
    totalAppliedWeight,
    weightedConfidenceSum,
    contributions,
    excluded,
    eligibleCount,
    partialCount,
    failedCount,
    hasDisclosedMismatch,
  } = evaluateEvidence(items, policy);
  const hasMinimum = eligibleCount >= policy.minimumEvidence;

  if (!hasMinimum || totalAppliedWeight === 0) {
    return {
      subject,
      status: 'insufficient',
      level: null,
      confidence: 0,
      evidenceCount: eligibleCount,
      minimumRequired: policy.minimumEvidence,
      lastUpdated: latestTimestamp(items),
      contributingEvidence: contributions,
      excludedEvidence: excluded,
      totalEvidence,
      eligibleEvidence: eligibleCount,
      partialEvidence: partialCount,
      failedEvidence: failedCount,
      excludedEvidenceCount: excluded.length,
      warnings: ['Insufficient eligible evidence'],
    };
  }

  const weightedMean = weightedSum / totalAppliedWeight;
  const weightedMeanConfidence = weightedConfidenceSum / totalAppliedWeight;
  const normalised = normaliseScore(weightedMean, policy.scoreNormalisationPolicy);
  const adjusted = policy.confidenceWeightingPolicy === 'weighted' ? normalised * weightedMeanConfidence : normalised;
  const levelResult = assignLevel(profile, adjusted);

  if (levelResult === null) {
    return {
      subject,
      status: 'insufficient',
      level: null,
      confidence: 0,
      evidenceCount: eligibleCount,
      minimumRequired: policy.minimumEvidence,
      lastUpdated: latestTimestamp(items),
      contributingEvidence: contributions,
      excludedEvidence: excluded,
      totalEvidence,
      eligibleEvidence: eligibleCount,
      partialEvidence: partialCount,
      failedEvidence: failedCount,
      excludedEvidenceCount: excluded.length,
      warnings: ['No mastery level matches the calculated score'],
    };
  }

  let status: 'partial' | 'sufficient';
  if (weightedMeanConfidence < policy.minimumConfidence || partialCount > 0) {
    status = 'partial';
    warnings.push('Partial evidence present');
  } else if (failedCount > 0 && policy.failedResultPolicy === 'include-with-disclosure') {
    status = 'partial';
    warnings.push('Failed evidence included with disclosure');
  } else if (excluded.length > 0) {
    status = 'partial';
    warnings.push(`${excluded.length} evidence record(s) excluded`);
  } else if (hasDisclosedMismatch) {
    status = 'partial';
    warnings.push('Profile mismatches included with disclosure');
  } else if (contributions.some((c) => c.inclusionReason !== 'complete-included')) {
    status = 'partial';
    warnings.push('Some evidence included with adjusted weighting');
  } else {
    status = 'sufficient';
  }

  if (policy.failedResultPolicy === 'include-with-disclosure' && failedCount > 0)
    warnings.push('Failed results included with disclosure — not treated as ordinary performance');

  return {
    subject,
    status,
    level: levelResult,
    confidence: weightedMeanConfidence,
    evidenceCount: eligibleCount,
    minimumRequired: policy.minimumEvidence,
    lastUpdated: latestTimestamp(items),
    contributingEvidence: contributions,
    excludedEvidence: excluded,
    totalEvidence,
    eligibleEvidence: eligibleCount,
    partialEvidence: partialCount,
    failedEvidence: failedCount,
    excludedEvidenceCount: excluded.length,
    warnings,
  };
}

function assignLevel(profile: MasteryProfile, score: number): number | null {
  const sorted = [...profile.levelDefinitions].sort((a, b) => b.threshold - a.threshold);
  for (const def of sorted) {
    if (score >= def.threshold) return def.value;
  }
  return profile.fallbackLevel;
}

function latestTimestamp(items: MasteryEvidence[]): string {
  return items.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), '');
}

export function calculateSkillMastery(
  profile: MasteryProfile,
  evidence: MasteryEvidence[],
): { levels: MasteryLevel[]; unassigned: UnassignedMasteryEvidence[] } {
  const unassigned: UnassignedMasteryEvidence[] = [];
  const valid: MasteryEvidence[] = [];
  for (const e of evidence) {
    if (isSkillEvidenceValid(e)) {
      valid.push(e);
    } else {
      unassigned.push({
        evidence: e,
        intendedMasteryType: 'skill',
        reason: 'malformed-identity',
        missingFields: missingSkillFields(e),
      });
    }
  }
  const groups = groupBy(valid, (e) => e.skillId);
  const levels = Object.entries(groups).map(([skillId, items]) =>
    computeLevel(
      profile,
      { subjectType: 'skill', subjectId: skillId, subjectName: items[0]?.skillName ?? skillId },
      items,
    ),
  );
  return { levels, unassigned };
}

export function calculateTaskMastery(
  profile: MasteryProfile,
  evidence: MasteryEvidence[],
): { levels: MasteryLevel[]; unassigned: UnassignedMasteryEvidence[] } {
  const unassigned: UnassignedMasteryEvidence[] = [];
  const valid: MasteryEvidence[] = [];
  for (const e of evidence) {
    if (isTaskEvidenceValid(e)) {
      valid.push(e);
    } else {
      unassigned.push({
        evidence: e,
        intendedMasteryType: 'task',
        reason: 'malformed-identity',
        missingFields: missingTaskFields(e),
      });
    }
  }
  const groups = groupBy(valid, (e) => e.taskId);
  const levels = Object.entries(groups).map(([taskId, items]) =>
    computeLevel(
      profile,
      {
        subjectType: 'task',
        subjectId: taskId,
        subjectName: items[0]?.taskName ?? taskId,
        taskType: items[0]?.taskType ?? '',
      },
      items,
    ),
  );
  return { levels, unassigned };
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    const g = map[key];
    if (g) g.push(item);
    else map[key] = [item];
  }
  return map;
}

export function buildMasterySnapshot(
  profile: MasteryProfile,
  userId: string,
  evidence: MasteryEvidence[],
  dataFreshness: 'fresh' | 'stale' | 'unknown',
  idGenerator: () => string = () => crypto.randomUUID(),
  timestampGenerator: () => string = () => new Date().toISOString(),
  mode: 'skill' | 'task' = 'skill',
): MasterySnapshot {
  const calc = mode === 'task' ? calculateTaskMastery(profile, evidence) : calculateSkillMastery(profile, evidence);
  const levels = calc.levels;
  const unassignedEvidence = calc.unassigned;
  const partialData = levels.some((l) => l.status === 'insufficient') || unassignedEvidence.length > 0;
  const collectedWarnings: string[] = [];
  if (unassignedEvidence.length > 0)
    collectedWarnings.push(`${unassignedEvidence.length} evidence record(s) could not be assigned to a valid subject`);
  if (partialData)
    collectedWarnings.push(
      mode === 'task' ? 'Some tasks have insufficient evidence' : 'Some skills have insufficient evidence',
    );
  for (const l of levels) collectedWarnings.push(...l.warnings);

  return {
    id: idGenerator() as MasterySnapshotId,
    profileId: profile.id as unknown as MasteryId,
    profileVersion: profile.version,
    userId,
    levels,
    unassignedEvidence,
    calculatedAt: timestampGenerator(),
    dataFreshness,
    partialData,
    warnings: collectedWarnings,
    masteryType: mode,
  };
}
