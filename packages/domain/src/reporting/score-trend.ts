import type { ScoreTrendPoint, ScoreTrendConfig, ScoreTrendSet } from '@pte-app/contracts';

export function buildScoreTrendSet(config: ScoreTrendConfig, points: ScoreTrendPoint[]): ScoreTrendSet {
  const warnings: string[] = [];

  if (points.length < config.minimumDataPoints) {
    warnings.push(`Insufficient data points: ${points.length} < ${config.minimumDataPoints}`);
  }

  const profileChanges = detectProfileChanges(points);

  if (profileChanges.length > 0 && config.profileChangePolicy === 'flag') {
    warnings.push('Profile version changes detected in trend period');
  }

  return {
    config,
    dataPoints: sortPoints(points),
    profileChanges,
    warnings,
  };
}

export function detectProfileChanges(
  points: ScoreTrendPoint[],
): Array<{ fromVersion: number; toVersion: number; effectiveAt: string }> {
  const sorted = sortPoints(points);
  const changes: Array<{ fromVersion: number; toVersion: number; effectiveAt: string }> = [];
  let lastVersion: number | undefined;

  for (const p of sorted) {
    if (lastVersion !== undefined && p.profileVersion !== lastVersion) {
      changes.push({ fromVersion: lastVersion, toVersion: p.profileVersion, effectiveAt: p.timestamp });
    }
    lastVersion = p.profileVersion;
  }

  return changes;
}

function sortPoints(points: ScoreTrendPoint[]): ScoreTrendPoint[] {
  return [...points].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function isProfileCompatible(
  a: { profileId: string; profileVersion: number },
  b: { profileId: string; profileVersion: number },
): boolean {
  return a.profileId === b.profileId && a.profileVersion === b.profileVersion;
}
