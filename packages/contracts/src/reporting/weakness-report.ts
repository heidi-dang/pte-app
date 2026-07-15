import type { WeaknessReportId } from './identifiers.js';

export interface WeaknessReport {
  id: WeaknessReportId;
  userId: string;
  weaknesses: Array<{
    skillId: string;
    skillName: string;
    score: number;
    gap: number;
    priority: 'high' | 'medium' | 'low';
    evidence: string;
    reason: string;
  }>;
  insufficientEvidence: boolean;
  createdAt: string;
  profileVersion: number;
  reportVersion: number;
}
