import type {
  MasteryProfile,
  MasteryLevel,
  MasterySnapshot,
  MasterySnapshotId,
  MasteryId,
  MasteryEvidence,
  EvidencePolicy,
} from '@pte-app/contracts';

export function calculateSkillMastery(profile: MasteryProfile, evidence: MasteryEvidence[]): MasteryLevel[] {
  const groups = groupBy<MasteryEvidence>(evidence, (e) => e.skillId);
  return Object.entries(groups).map(([skillId, items]) =>
    computeLevel(profile, skillId, items[0]?.skillName ?? id ?? skillId, items),
  );
}

export function calculateTaskMastery(profile: MasteryProfile, evidence: MasteryEvidence[]): MasteryLevel[] {
  const groups = groupBy<MasteryEvidence>(evidence, (e) => e.taskId);
  return Object.entries(groups).map(([taskId, items]) =>
    computeLevel(profile, taskId, items[0]?.taskName ?? taskId, items),
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

function computeLevel(profile: MasteryProfile, id: string, name: string, items: MasteryEvidence[]): MasteryLevel {
  const policy = profile.evidencePolicy;
  const totalEvidence = items.length;

  const eligible = items.filter((e) => isEligible(e, policy));
  const partialEvidence = items.filter((e) => e.completenessStatus === 'partial').length;
  const failedEvidence = items.filter((e) => e.completenessStatus === 'failed').length;
  const excludedEvidence = totalEvidence - eligible.length;

  const hasMinimum = eligible.length >= policy.minimumEvidence;

  if (!hasMinimum) {
    return {
      skillId: id,
      skillName: name,
      status: 'insufficient',
      level: null,
      confidence: 0,
      evidenceCount: eligible.length,
      minimumRequired: policy.minimumEvidence,
      lastUpdated: latestTimestamp(items),
      contributingAttempts: items,
      totalEvidence,
      eligibleEvidence: eligible.length,
      partialEvidence,
      failedEvidence,
      excludedEvidence,
    };
  }

  const meanScore = eligible.reduce((sum, e) => sum + e.estimatedTrainingScore, 0) / eligible.length;
  const meanConfidence = eligible.reduce((sum, e) => sum + e.confidence, 0) / eligible.length;
  const adjusted = applyConfidenceWeighting(meanScore, meanConfidence, policy);
  const level = assignLevel(profile, adjusted);

  let status: 'partial' | 'sufficient';
  if (meanConfidence < policy.minimumConfidence || partialEvidence > 0) {
    status = 'partial';
  } else {
    status = 'sufficient';
  }

  return {
    skillId: id,
    skillName: name,
    status,
    level,
    confidence: meanConfidence,
    evidenceCount: eligible.length,
    minimumRequired: policy.minimumEvidence,
    lastUpdated: latestTimestamp(items),
    contributingAttempts: items,
    totalEvidence,
    eligibleEvidence: eligible.length,
    partialEvidence,
    failedEvidence,
    excludedEvidence,
  };
}

function isEligible(evidence: MasteryEvidence, policy: EvidencePolicy): boolean {
  if (evidence.completenessStatus === 'failed') {
    return policy.failedResultPolicy === 'include-with-disclosure';
  }
  if (evidence.completenessStatus === 'partial') {
    return policy.partialResultPolicy !== 'exclude';
  }
  return true;
}

function applyConfidenceWeighting(score: number, confidence: number, policy: EvidencePolicy): number {
  if (policy.confidenceWeightingPolicy === 'weighted') {
    return score * confidence;
  }
  return score;
}

function assignLevel(profile: MasteryProfile, score: number): number {
  const sorted = Object.entries(profile.levelDefinitions).sort(([, a], [, b]) => b.threshold - a.threshold);
  for (const [, def] of sorted) {
    if (score >= def.threshold) return parseInt(def.label) || 1;
  }
  return 0;
}

function latestTimestamp(items: MasteryEvidence[]): string {
  return items.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), '');
}

export function buildMasterySnapshot(
  profile: MasteryProfile,
  userId: string,
  evidence: MasteryEvidence[],
  dataFreshness: 'fresh' | 'stale' | 'unknown',
  idGenerator: () => string = () => crypto.randomUUID(),
  timestampGenerator: () => string = () => new Date().toISOString(),
): MasterySnapshot {
  const levels = calculateSkillMastery(profile, evidence);
  const partialData = levels.some((l) => l.status === 'insufficient');
  const warnings: string[] = [];
  if (partialData) warnings.push('Some skills have insufficient evidence');
  if (levels.some((l) => l.status === 'insufficient')) warnings.push('Some skills could not be assigned a level');

  return {
    id: idGenerator() as MasterySnapshotId,
    profileId: profile.id as unknown as MasteryId,
    profileVersion: profile.version,
    userId,
    levels,
    calculatedAt: timestampGenerator(),
    dataFreshness,
    partialData,
    warnings,
  };
}
