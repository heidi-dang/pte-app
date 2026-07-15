/**
 * Skill profile — estimated skill levels from diagnostic results.
 */
export interface SkillProfile {
  id: string;
  userId: string;
  diagnosticSessionId: string;
  skills: SkillLevel[];
  confidence: number;
  missingEvidence: string[];
  weaknessRationale: string;
  createdAt: string;
}

export interface SkillLevel {
  skillId: string;
  estimatedScore: number;
  confidence: number;
  evidenceCount: number;
  isWeakness: boolean;
}
