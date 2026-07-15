import type { WeaknessReport, WeaknessReportId } from '@pte-app/contracts';

export function buildWeaknessReport(
  userId: string,
  skills: Array<{
    skillId: string;
    skillName: string;
    score: number;
    gap: number;
    priority: 'high' | 'medium' | 'low';
    evidence: string;
    reason: string;
  }>,
  profileVersion: number,
): WeaknessReport {
  return {
    id: crypto.randomUUID() as WeaknessReportId,
    userId,
    weaknesses: skills,
    insufficientEvidence: skills.length === 0,
    createdAt: new Date().toISOString(),
    profileVersion,
    reportVersion: 1,
  };
}
