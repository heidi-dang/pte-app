import type { SkillProfile, SkillLevel } from '@pte-app/contracts';

/**
 * Weakness detector — identifies skill weaknesses from profile.
 */
export function detectWeaknesses(profile: SkillProfile, threshold: number = 0.6): SkillLevel[] {
  return profile.skills.filter((s) => s.estimatedScore < threshold);
}

/**
 * Target gap calculator.
 */
export function calculateTargetGap(currentScore: number, targetScore: number): number {
  return Math.max(0, Math.round((targetScore - currentScore) * 1e6) / 1e6);
}
