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
  LinearDirection,
} from '@pte-app/contracts';

export class MasteryValidationError extends Error {
  code:
    | 'INVALID_LINEAR_NORMALISATION_RANGE'
    | 'INVALID_LINEAR_DIRECTION'
    | 'INVALID_Z_SCORE_STANDARD_DEVIATION'
    | 'NO_MASTERY_LEVEL_MATCH';
  constructor(code: MasteryValidationError['code'], message: string) {
    super(message);
    this.name = 'MasteryValidationError';
    this.code = code;
  }
}

function validateLinearPolicy(d: {
  inputMinimum: number;
  inputMaximum: number;
  direction: LinearDirection;
  outputMinimum: number;
  outputMaximum: number;
}): void {
  if (d.inputMaximum <= d.inputMinimum)
    throw new MasteryValidationError('INVALID_LINEAR_NORMALISATION_RANGE', 'inputMax must be > inputMin');
  if (d.direction === 'ascending' && d.outputMaximum <= d.outputMinimum)
    throw new MasteryValidationError('INVALID_LINEAR_DIRECTION', 'ascending requires outputMax > outputMin');
  if (d.direction === 'descending' && d.outputMaximum >= d.outputMinimum)
    throw new MasteryValidationError('INVALID_LINEAR_DIRECTION', 'descending requires outputMax < outputMin');
}

function normaliseScore(v: number, policy: ScoreNormalisationPolicy): number {
  switch (policy.method) {
    case 'none':
      return v;
    case 'linear': {
      validateLinearPolicy(policy);
      const r = (v - policy.inputMinimum) / (policy.inputMaximum - policy.inputMinimum);
      return policy.outputMinimum + r * (policy.outputMaximum - policy.outputMinimum);
    }
    case 'z-score': {
      if (policy.referenceStandardDeviation <= 0)
        throw new MasteryValidationError('INVALID_Z_SCORE_STANDARD_DEVIATION', 'std dev must be > 0');
      return (v - policy.referenceMean) / policy.referenceStandardDeviation;
    }
  }
}

function inclusionReasonFor(e: MasteryEvidence, policy: EvidencePolicy): InclusionReason {
  if (e.completenessStatus === 'failed') return 'failed-included-with-disclosure';
  if (e.completenessStatus === 'partial')
    return policy.partialResultPolicy === 'discount' ? 'partial-discounted' : 'partial-included';
  return 'complete-included';
}

function computeProfileCompatibility(e: MasteryEvidence, policy: EvidencePolicy): ProfileCompatibility {
  if (policy.mixedProfilePolicy !== 'disclose-mismatched') return { status: 'matched' };
  const m: Array<
    | 'scoring-profile-id'
    | 'scoring-profile-version'
    | 'evaluation-profile-id'
    | 'evaluation-profile-version'
    | 'evaluation-profile-missing'
  > = [];
  if (policy.referenceScoringProfileId !== null && e.scoringProfileId !== policy.referenceScoringProfileId)
    m.push('scoring-profile-id');
  if (
    policy.referenceScoringProfileVersion !== null &&
    e.scoringProfileVersion !== policy.referenceScoringProfileVersion
  )
    m.push('scoring-profile-version');
  if (
    policy.referenceEvaluationProfileId !== null &&
    e.evaluationProfileId !== null &&
    e.evaluationProfileId !== policy.referenceEvaluationProfileId
  )
    m.push('evaluation-profile-id');
  if (
    policy.referenceEvaluationProfileVersion !== null &&
    e.evaluationProfileVersion !== null &&
    e.evaluationProfileVersion !== policy.referenceEvaluationProfileVersion
  )
    m.push('evaluation-profile-version');
  if (
    policy.referenceEvaluationProfileId !== null &&
    e.evaluationProfileId === null &&
    e.evaluationProfileVersion === null
  )
    m.push('evaluation-profile-missing');
  if (m.length > 0) return { status: 'included-with-disclosure', mismatches: m } as ProfileCompatibility;
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
    if (
      policy.referenceEvaluationProfileId !== null &&
      e.evaluationProfileId === null &&
      e.evaluationProfileVersion === null
    )
      return { compatible: false, reason: 'missing-reference-evaluation-profile' };
  }
  return { compatible: true };
}

// ----------------------------------------------------------------
// Evidence classifier: returns either valid or unassigned
// ----------------------------------------------------------------
type EvidenceClassification =
  | { status: 'valid'; evidence: MasteryEvidence }
  | {
      status: 'unassigned';
      evidence: MasteryEvidence;
      reason: UnassignedMasteryEvidence['reason'];
      invalidFields: string[];
    };

function classifyEvidenceForMastery(e: MasteryEvidence, mode: 'skill' | 'task'): EvidenceClassification {
  const invalidFields: string[] = [];
  const check = (cond: boolean, field: string) => {
    if (!cond) invalidFields.push(field);
  };

  // Common required fields
  check(!!e.attemptId, 'attemptId');
  check(!!e.resultId, 'resultId');
  check(!!e.questionVersionId, 'questionVersionId');
  check(!!e.scoringProfileId, 'scoringProfileId');
  check(!!e.timestamp, 'timestamp');
  check(e.scoringProfileVersion >= 1, 'scoringProfileVersion');

  // Mode-specific identity
  if (mode === 'task') {
    check(!!e.taskId, 'taskId');
    check(!!e.taskType, 'taskType');
    check(!!e.taskName, 'taskName');
  } else {
    check(!!e.skillId, 'skillId');
    check(!!e.skillName, 'skillName');
  }

  // Evaluation pairing
  const evalIdPresent = e.evaluationProfileId !== null && e.evaluationProfileId !== '';
  const evalVerPresent = e.evaluationProfileVersion !== null && e.evaluationProfileVersion >= 1;

  if (evalIdPresent && !evalVerPresent) {
    invalidFields.push('evaluationProfileId/evaluationProfileVersion');
  }
  if (!evalIdPresent && evalVerPresent) {
    invalidFields.push('evaluationProfileId/evaluationProfileVersion');
  }
  if (evalIdPresent && evalVerPresent && e.evaluationProfileVersion! < 1) {
    invalidFields.push('evaluationProfileVersion');
  }
  if (evalIdPresent && !e.evaluationProfileId) {
    invalidFields.push('evaluationProfileId');
  }

  if (invalidFields.length === 0) return { status: 'valid', evidence: e };

  const identMissing = invalidFields.some((f) =>
    ['attemptId', 'resultId', 'questionVersionId', 'taskId', 'taskType', 'taskName', 'skillId', 'skillName'].includes(
      f,
    ),
  );
  const profInvalid = invalidFields.some((f) => f.includes('scoringProfile'));
  const evalInvalid = invalidFields.some((f) => f.includes('evaluation'));

  if (evalInvalid) return { status: 'unassigned', evidence: e, reason: 'invalid-evaluation-pair', invalidFields };
  if (profInvalid) return { status: 'unassigned', evidence: e, reason: 'invalid-profile-reference', invalidFields };
  if (identMissing) return { status: 'unassigned', evidence: e, reason: 'malformed-identity', invalidFields };
  return { status: 'unassigned', evidence: e, reason: 'missing-required-field', invalidFields };
}

function classifyExclude(
  e: MasteryEvidence,
  policy: EvidencePolicy,
): { eligible: boolean; weight: number; excludedReason?: ExcludedEvidence['reason'] } {
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
      excluded.push({ evidence: e, reason: compat.reason! });
      continue;
    }
    const pc = computeProfileCompatibility(e, policy);
    if (pc.status === 'included-with-disclosure') hasDisclosedMismatch = true;
    const cls = classifyExclude(e, policy);
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
  const hasMin = eligibleCount >= policy.minimumEvidence;
  if (!hasMin || totalAppliedWeight === 0)
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
  const wm = weightedSum / totalAppliedWeight;
  const wmc = weightedConfidenceSum / totalAppliedWeight;
  const n = normaliseScore(wm, policy.scoreNormalisationPolicy);
  const adj = policy.confidenceWeightingPolicy === 'weighted' ? n * wmc : n;
  const lr = assignLevel(profile, adj);
  if (lr === null)
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
  let status: 'partial' | 'sufficient';
  if (wmc < policy.minimumConfidence || partialCount > 0) {
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
    level: lr,
    confidence: wmc,
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
  const s = [...profile.levelDefinitions].sort((a, b) => b.threshold - a.threshold);
  for (const d of s) {
    if (score >= d.threshold) return d.value;
  }
  return profile.fallbackLevel;
}

function latestTimestamp(items: MasteryEvidence[]): string {
  return items.reduce((lt, e) => (e.timestamp > lt ? e.timestamp : lt), '');
}

export function calculateSkillMastery(
  profile: MasteryProfile,
  evidence: MasteryEvidence[],
): { levels: MasteryLevel[]; unassigned: UnassignedMasteryEvidence[] } {
  const unassigned: UnassignedMasteryEvidence[] = [];
  const valid: MasteryEvidence[] = [];
  for (const e of evidence) {
    const c = classifyEvidenceForMastery(e, 'skill');
    if (c.status === 'valid') valid.push(c.evidence);
    else
      unassigned.push({
        evidence: c.evidence,
        intendedMasteryType: 'skill',
        reason: c.reason,
        invalidFields: c.invalidFields,
      });
  }
  const groups = groupBy(valid, (e) => e.skillId);
  const levels = Object.entries(groups).map(([id, items]) =>
    computeLevel(profile, { subjectType: 'skill', subjectId: id, subjectName: items[0]?.skillName ?? id }, items),
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
    const c = classifyEvidenceForMastery(e, 'task');
    if (c.status === 'valid') valid.push(c.evidence);
    else
      unassigned.push({
        evidence: c.evidence,
        intendedMasteryType: 'task',
        reason: c.reason,
        invalidFields: c.invalidFields,
      });
  }
  const groups = groupBy(valid, (e) => e.taskId);
  const levels = Object.entries(groups).map(([id, items]) =>
    computeLevel(
      profile,
      { subjectType: 'task', subjectId: id, subjectName: items[0]?.taskName ?? id, taskType: items[0]?.taskType ?? '' },
      items,
    ),
  );
  return { levels, unassigned };
}

function groupBy<T>(items: T[], fn: (i: T) => string): Record<string, T[]> {
  const m: Record<string, T[]> = {};
  for (const i of items) {
    const k = fn(i);
    const g = m[k];
    if (g) g.push(i);
    else m[k] = [i];
  }
  return m;
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
