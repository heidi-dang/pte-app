export interface DiagnosticResult {
  readonly userId: string;
  readonly completedAt: string;
  readonly overallScore: number;
  readonly weaknesses: string[];
  readonly strengths: string[];
  readonly recommendations: string[];
}

export class DiagnosticService {
  async generateStudyPlan(
    userId: string,
    diagnostic: DiagnosticResult,
  ): Promise<{ dailyPlan: string[]; weeklyActivities: string[] }> {
    return {
      dailyPlan: diagnostic.weaknesses.map((w) => `Practice: ${w}`),
      weeklyActivities: diagnostic.recommendations,
    };
  }
}
