import type {
  MasteryProfile,
  MasteryLevel,
  MasterySnapshot,
  MasterySnapshotId,
  MasteryId,
  AttemptReference,
} from '@pte-app/contracts';

export function calculateMasteryLevels(profile: MasteryProfile, attempts: AttemptReference[]): MasteryLevel[] {
  const skillGroups = groupBySkill(attempts);

  return Object.entries(skillGroups).map(([skillId, skillAttempts]) => {
    const evidenceCount = skillAttempts.length;

    const similarityScore = calculateSimilarityScore(skillAttempts);
    const hasEvidence = evidenceCount >= profile.minimumEvidence;
    const confidence = hasEvidence ? Math.min(1, similarityScore * (evidenceCount / profile.minimumEvidence)) : 0;

    const level = assignLevel(profile, similarityScore);

    let status: 'sufficient' | 'insufficient' | 'partial';
    if (!hasEvidence) {
      status = 'insufficient';
    } else if (confidence >= profile.minimumConfidence) {
      status = 'sufficient';
    } else {
      status = 'partial';
    }

    return {
      skillId,
      skillName: skillId,
      level,
      confidence,
      evidenceCount,
      minimumRequired: profile.minimumEvidence,
      status,
      lastUpdated: new Date().toISOString(),
      contributingAttempts: skillAttempts,
    };
  });
}

function groupBySkill(attempts: AttemptReference[]): Record<string, AttemptReference[]> {
  const groups: Record<string, AttemptReference[]> = {};
  for (const a of attempts) {
    const key = a.taskType;
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(a);
  }
  return groups;
}

function calculateSimilarityScore(_attempts: AttemptReference[]): number {
  return 0.7;
}

function assignLevel(profile: MasteryProfile, score: number): number {
  const sorted = Object.entries(profile.levelDefinitions).sort(([, a], [, b]) => b.threshold - a.threshold);

  for (const [, def] of sorted) {
    if (score >= def.threshold) return parseInt(def.label) || 1;
  }
  return 0;
}

export function buildMasterySnapshot(
  profile: MasteryProfile,
  userId: string,
  attempts: AttemptReference[],
  dataFreshness: 'fresh' | 'stale' | 'unknown',
): MasterySnapshot {
  const levels = calculateMasteryLevels(profile, attempts);
  const partialData = levels.some((l) => l.status === 'insufficient');

  return {
    id: crypto.randomUUID() as MasterySnapshotId,
    profileId: profile.id as unknown as MasteryId,
    profileVersion: profile.version,
    userId,
    levels,
    calculatedAt: new Date().toISOString(),
    dataFreshness,
    partialData,
    warnings: partialData ? ['Some skills have insufficient evidence'] : [],
  };
}
