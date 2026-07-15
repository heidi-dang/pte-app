import type { MasteryProfile, MasteryLevel, MasterySnapshot, MasterySnapshotId, MasteryId } from '@pte-app/contracts';

export interface SkillEvidence {
  skillId: string;
  skillName: string;
  taskId: string;
  resultId: string;
  estimatedScore: number;
  confidence: number;
  profileVersion: number;
  completenessStatus: 'complete' | 'partial' | 'failed';
  timestamp: string;
}

export function calculateSkillMastery(profile: MasteryProfile, evidence: SkillEvidence[]): MasteryLevel[] {
  const groups = groupBySkillId(evidence);
  return Object.entries(groups).map(([skillId, items]) =>
    computeLevel(profile, skillId, items[0]?.skillName ?? skillId, items),
  );
}

export function calculateTaskMastery(profile: MasteryProfile, evidence: SkillEvidence[]): MasteryLevel[] {
  const groups = groupByTaskId(evidence);
  return Object.entries(groups).map(([taskId, items]) =>
    computeLevel(profile, taskId, items[0]?.skillName ?? taskId, items),
  );
}

function groupBySkillId(evidence: SkillEvidence[]): Record<string, SkillEvidence[]> {
  const map: Record<string, SkillEvidence[]> = {};
  for (const e of evidence) {
    if (!map[e.skillId]) map[e.skillId] = [];
    map[e.skillId]!.push(e);
  }
  return map;
}

function groupByTaskId(evidence: SkillEvidence[]): Record<string, SkillEvidence[]> {
  const map: Record<string, SkillEvidence[]> = {};
  for (const e of evidence) {
    if (!map[e.taskId]) map[e.taskId] = [];
    map[e.taskId]!.push(e);
  }
  return map;
}

function computeLevel(profile: MasteryProfile, id: string, name: string, items: SkillEvidence[]): MasteryLevel {
  const evidenceCount = items.length;
  const hasEvidence = evidenceCount >= profile.minimumEvidence;

  if (!hasEvidence) {
    return {
      skillId: id,
      skillName: name,
      level: -1,
      confidence: 0,
      evidenceCount,
      minimumRequired: profile.minimumEvidence,
      status: 'insufficient',
      lastUpdated: items.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), ''),
      contributingAttempts: items.map((e) => ({
        resultId: e.resultId,
        questionVersionId: e.taskId,
        taskType: e.skillId,
        completedAt: e.timestamp,
        estimatedScore: e.estimatedScore,
      })),
    };
  }

  const meanScore = items.reduce((sum, e) => sum + e.estimatedScore, 0) / items.length;
  const meanConfidence = items.reduce((sum, e) => sum + e.confidence, 0) / items.length;
  const adjusted = meanScore * meanConfidence;
  const level = assignLevel(profile, adjusted);

  let status: 'sufficient' | 'insufficient' | 'partial';
  if (meanConfidence < profile.minimumConfidence) {
    status = 'partial';
  } else if (evidenceCount >= profile.minimumEvidence) {
    status = 'sufficient';
  } else {
    status = 'insufficient';
  }

  return {
    skillId: id,
    skillName: name,
    level,
    confidence: meanConfidence,
    evidenceCount,
    minimumRequired: profile.minimumEvidence,
    status,
    lastUpdated: items.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), ''),
    contributingAttempts: items.map((e) => ({
      resultId: e.resultId,
      questionVersionId: e.taskId,
      taskType: e.skillId,
      completedAt: e.timestamp,
      estimatedScore: e.estimatedScore,
    })),
  };
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
  evidence: SkillEvidence[],
  dataFreshness: 'fresh' | 'stale' | 'unknown',
  idGenerator: () => string = () => crypto.randomUUID(),
  timestampGenerator: () => string = () => new Date().toISOString(),
): MasterySnapshot {
  const levels = calculateSkillMastery(profile, evidence);
  const partialData = levels.some((l) => l.status === 'insufficient');
  const warnings: string[] = [];
  if (partialData) warnings.push('Some skills have insufficient evidence');
  if (levels.some((l) => l.level === -1)) warnings.push('Some skills could not be assigned a level');

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
