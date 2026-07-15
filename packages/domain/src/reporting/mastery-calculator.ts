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
} from '@pte-app/contracts';

function normaliseScore(value: number, policy: ScoreNormalisationPolicy): number {
  switch (policy.method) {
    case 'none':
      return value;
    case 'linear': {
      const range = policy.inputMaximum - policy.inputMinimum;
      if (range === 0) return policy.outputMinimum;
      const ratio = (value - policy.inputMinimum) / range;
      return policy.outputMinimum + ratio * (policy.outputMaximum - policy.outputMinimum);
    }
    case 'z-score': {
      if (policy.referenceStandardDeviation === 0) return value;
      return (value - policy.referenceMean) / policy.referenceStandardDeviation;
    }
  }
}

function applyPartialWeight(value: number, policy: EvidencePolicy): number {
  if (policy.partialResultPolicy === 'discount') {
    return value * policy.partialResultWeight;
  }
  return value;
}

function isCompatible(
  evidence: MasteryEvidence,
  policy: EvidencePolicy,
): { compatible: boolean; reason?: ExcludedEvidence['reason'] } {
  if (
    policy.allowedScoringProfileIds.length > 0 &&
    !policy.allowedScoringProfileIds.includes(evidence.scoringProfileId)
  ) {
    return { compatible: false, reason: 'incompatible-result-profile' };
  }
  if (
    policy.allowedScoringProfileVersions.length > 0 &&
    !policy.allowedScoringProfileVersions.includes(evidence.scoringProfileVersion)
  ) {
    return { compatible: false, reason: 'invalid-profile-version' };
  }
  if (
    evidence.evaluationProfileId &&
    policy.allowedEvaluationProfileIds.length > 0 &&
    !policy.allowedEvaluationProfileIds.includes(evidence.evaluationProfileId)
  ) {
    return { compatible: false, reason: 'incompatible-result-profile' };
  }
  if (
    evidence.evaluationProfileVersion !== null &&
    policy.allowedEvaluationProfileVersions.length > 0 &&
    !policy.allowedEvaluationProfileVersions.includes(evidence.evaluationProfileVersion)
  ) {
    return { compatible: false, reason: 'invalid-profile-version' };
  }
  if (policy.mixedProfilePolicy === 'exclude-mismatched') {
    const versions = new Set(policy.allowedScoringProfileVersions);
    if (versions.size > 1 && evidence.scoringProfileVersion !== undefined) {
      const mismatched = evidence.scoringProfileVersion !== policy.allowedScoringProfileVersions[0];
      if (mismatched) return { compatible: false, reason: 'invalid-profile-version' };
    }
  }
  return { compatible: true };
}

function classifyEvidence(
  evidence: MasteryEvidence,
  policy: EvidencePolicy,
): { eligible: boolean; excludedReason?: ExcludedEvidence['reason']; weight: number } {
  if (evidence.completenessStatus === 'failed') {
    if (policy.failedResultPolicy === 'include-with-disclosure') {
      return { eligible: true, weight: policy.failedResultWeight };
    }
    return { eligible: false, excludedReason: 'failed-policy-excluded', weight: 0 };
  }
  if (evidence.completenessStatus === 'partial') {
    if (policy.partialResultPolicy === 'exclude') {
      return { eligible: false, excludedReason: 'partial-policy-excluded', weight: 0 };
    }
    return { eligible: true, weight: applyPartialWeight(1, policy) };
  }
  return { eligible: true, weight: 1 };
}

function evaluateEvidence(
  evidence: MasteryEvidence[],
  policy: EvidencePolicy,
): {
  weightedSum: number;
  contributing: MasteryEvidence[];
  excluded: ExcludedEvidence[];
  eligibleCount: number;
  partialCount: number;
  failedCount: number;
} {
  const contributing: MasteryEvidence[] = [];
  const excluded: ExcludedEvidence[] = [];
  let eligibleCount = 0;
  let partialCount = 0;
  let failedCount = 0;
  let weightedSum = 0;

  for (const e of evidence) {
    if (e.completenessStatus === 'partial') partialCount++;
    if (e.completenessStatus === 'failed') failedCount++;

    const compat = isCompatible(e, policy);
    if (!compat.compatible) {
      const reasonVal: ExcludedEvidence['reason'] = compat.reason ?? 'missing-required-field';
      excluded.push({ evidence: e, reason: reasonVal });
      continue;
    }

    const cls = classifyEvidence(e, policy);
    if (cls.eligible) {
      contributing.push(e);
      eligibleCount++;
      weightedSum += e.estimatedTrainingScore * cls.weight;
    } else if (cls.excludedReason) {
      excluded.push({ evidence: e, reason: cls.excludedReason });
    }
  }

  return { weightedSum, contributing, excluded, eligibleCount, partialCount, failedCount };
}

function computeLevel(profile: MasteryProfile, subject: MasterySubject, items: MasteryEvidence[]): MasteryLevel {
  const policy = profile.evidencePolicy;
  const totalEvidence = items.length;
  const warnings: string[] = [];

  const { weightedSum, contributing, excluded, eligibleCount, partialCount, failedCount } = evaluateEvidence(
    items,
    policy,
  );
  const hasMinimum = eligibleCount >= policy.minimumEvidence;

  if (!hasMinimum) {
    return {
      subject,
      status: 'insufficient',
      level: null,
      confidence: 0,
      evidenceCount: eligibleCount,
      minimumRequired: policy.minimumEvidence,
      lastUpdated: latestTimestamp(items),
      contributingEvidence: contributing,
      excludedEvidence: excluded,
      totalEvidence,
      eligibleEvidence: eligibleCount,
      partialEvidence: partialCount,
      failedEvidence: failedCount,
      excludedEvidenceCount: excluded.length,
      warnings: ['Insufficient eligible evidence'],
    };
  }

  const rawMean = weightedSum / contributing.length;
  const normalised = normaliseScore(rawMean, policy.scoreNormalisationPolicy);
  const meanConfidence = contributing.reduce((sum, e) => sum + e.confidence, 0) / contributing.length;
  const adjusted = policy.confidenceWeightingPolicy === 'weighted' ? normalised * meanConfidence : normalised;

  const level = assignLevel(profile, adjusted);

  let status: 'partial' | 'sufficient';
  if (meanConfidence < policy.minimumConfidence || partialCount > 0) {
    status = 'partial';
    warnings.push('Partial evidence present');
  } else if (failedCount > 0 && policy.failedResultPolicy === 'include-with-disclosure') {
    status = 'partial';
    warnings.push('Failed evidence included with disclosure');
  } else if (excluded.length > 0) {
    status = 'partial';
    warnings.push(`${excluded.length} evidence record(s) excluded`);
  } else {
    status = 'sufficient';
  }

  if (policy.failedResultPolicy === 'include-with-disclosure' && failedCount > 0) {
    warnings.push(`Failed results included with disclosure — not treated as ordinary performance`);
  }

  return {
    subject,
    status,
    level,
    confidence: meanConfidence,
    evidenceCount: eligibleCount,
    minimumRequired: policy.minimumEvidence,
    lastUpdated: latestTimestamp(items),
    contributingEvidence: contributing,
    excludedEvidence: excluded,
    totalEvidence,
    eligibleEvidence: eligibleCount,
    partialEvidence: partialCount,
    failedEvidence: failedCount,
    excludedEvidenceCount: excluded.length,
    warnings,
  };
}

function assignLevel(profile: MasteryProfile, score: number): number {
  const sorted = [...profile.levelDefinitions].sort((a, b) => b.threshold - a.threshold);
  for (const def of sorted) {
    if (score >= def.threshold) return def.value;
  }
  if (profile.fallbackLevel !== null) return profile.fallbackLevel;
  return 0;
}

function latestTimestamp(items: MasteryEvidence[]): string {
  return items.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), '');
}

export function calculateSkillMastery(profile: MasteryProfile, evidence: MasteryEvidence[]): MasteryLevel[] {
  const groups = groupBy(evidence, (e) => e.skillId);
  return Object.entries(groups).map(([skillId, items]) =>
    computeLevel(
      profile,
      { subjectType: 'skill', subjectId: skillId, subjectName: items[0]?.skillName ?? skillId },
      items,
    ),
  );
}

export function calculateTaskMastery(profile: MasteryProfile, evidence: MasteryEvidence[]): MasteryLevel[] {
  const groups = groupBy(evidence, (e) => e.taskId);
  return Object.entries(groups).map(([taskId, items]) =>
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
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    const group = map[key];
    if (group) {
      group.push(item);
    } else {
      map[key] = [item];
    }
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
  const levels = mode === 'task' ? calculateTaskMastery(profile, evidence) : calculateSkillMastery(profile, evidence);
  const partialData = levels.some((l) => l.status === 'insufficient');
  const collectedWarnings: string[] = [];
  if (partialData) collectedWarnings.push('Some skills have insufficient evidence');
  for (const l of levels) {
    collectedWarnings.push(...l.warnings);
  }

  return {
    id: idGenerator() as MasterySnapshotId,
    profileId: profile.id as unknown as MasteryId,
    profileVersion: profile.version,
    userId,
    levels,
    calculatedAt: timestampGenerator(),
    dataFreshness,
    partialData,
    warnings: collectedWarnings,
  };
}
