import type { SkillProfile, DiagnosticReport, Weakness, TargetGap } from '@pte-app/contracts';

/**
 * Report generator — creates diagnostic report from skill profile.
 */
export function generateReport(profile: SkillProfile, targetScores: Record<string, number>): DiagnosticReport {
  const weaknesses: Weakness[] = profile.skills
    .filter((s) => s.isWeakness)
    .map((s) => ({
      skillId: s.skillId,
      currentScore: s.estimatedScore,
      targetScore: targetScores[s.skillId] ?? s.estimatedScore,
      gap: Math.max(0, (targetScores[s.skillId] ?? s.estimatedScore) - s.estimatedScore),
      priority: s.estimatedScore < 0.4 ? 'high' : s.estimatedScore < 0.6 ? 'medium' : ('low' as const),
      recommendedActivities: [`practice_${s.skillId}`],
    }));

  const targetGaps: TargetGap[] = Object.entries(targetScores).map(([skillId, target]) => {
    const skill = profile.skills.find((s) => s.skillId === skillId);
    const current = skill?.estimatedScore ?? 0;
    return {
      skillId,
      currentScore: current,
      targetScore: target,
      gap: Math.max(0, target - current),
      examDate: '',
      studyDaysAvailable: 0,
    };
  });

  const overallScore =
    profile.skills.length > 0
      ? profile.skills.reduce((sum: number, s) => sum + s.estimatedScore, 0) / profile.skills.length
      : 0;

  return {
    id: `dr_${Date.now()}`,
    userId: profile.userId,
    skillProfileId: profile.id,
    weaknesses,
    targetGaps,
    overallEstimatedScore: overallScore,
    recommendations: weaknesses.map((w) => `Focus on ${w.skillId} (gap: ${w.gap.toFixed(2)})`),
    isPartial: profile.missingEvidence.length > 0,
    generatedAt: new Date().toISOString(),
  };
}
