/**
 * Diagnostic report — generated from skill profile and weakness analysis.
 */
import type { Weakness, TargetGap } from './weakness.js';

export interface DiagnosticReport {
  id: string;
  userId: string;
  skillProfileId: string;
  weaknesses: Weakness[];
  targetGaps: TargetGap[];
  overallEstimatedScore: number;
  recommendations: string[];
  isPartial: boolean;
  generatedAt: string;
}
