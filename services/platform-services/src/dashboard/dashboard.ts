/**
 * Phase R — Dashboard, Reports and Skill Mastery
 */

export interface StudentDashboard {
  readonly userId: string;
  readonly recentActivity: ActivityItem[];
  readonly studyPlanProgress: number;
  readonly estimatedScore: number;
  readonly scoreTrend: number[];
  readonly weaknesses: string[];
  readonly nextMilestone: string;
}

export interface ActivityItem {
  readonly type: 'practice' | 'lesson' | 'mock' | 'review';
  readonly description: string;
  readonly completedAt: string;
  readonly score?: number;
}

export interface SkillMastery {
  readonly skill: string;
  readonly level: number;
  readonly attemptsCount: number;
  readonly averageScore: number;
}

export class DashboardService {
  async getDashboard(userId: string): Promise<StudentDashboard> {
    return {
      userId,
      recentActivity: [],
      studyPlanProgress: 0,
      estimatedScore: 0,
      scoreTrend: [],
      weaknesses: [],
      nextMilestone: 'Complete your first diagnostic',
    };
  }

  async getSkillMastery(userId: string): Promise<SkillMastery[]> {
    return [];
  }

  async getAttemptHistory(userId: string): Promise<ActivityItem[]> {
    return [];
  }
}
