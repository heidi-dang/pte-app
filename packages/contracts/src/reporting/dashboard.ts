import type { DashboardId, ReportProfileId } from './identifiers.js';
import type { ActivityItem } from './activity.js';
import type { WeaknessReport } from './weakness-report.js';

export interface Dashboard {
  id: DashboardId;
  userId: string;
  reportProfileId: ReportProfileId;
  latestStudyPlanProgress: {
    completedActivities: number;
    totalActivities: number;
    percentage: number;
    updatedAt: string;
  } | null;
  recentActivity: ActivityItem[];
  latestResults: Array<{
    resultId: string;
    taskType: string;
    estimatedScore: number;
    classification: string;
    createdAt: string;
  }>;
  currentWeaknesses: WeaknessReport[];
  pendingProcessing: number;
  failedProcessing: number;
  staleDataIndicator: boolean;
  links: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDashboard {
  id: DashboardId;
  userId: string;
  latestStudyPlanProgress: Dashboard['latestStudyPlanProgress'];
  recentActivity: ActivityItem[];
  latestResults: Dashboard['latestResults'];
  currentWeaknesses: WeaknessReport[];
  pendingProcessing: number;
  failedProcessing: number;
  staleDataIndicator: boolean;
  createdAt: string;
  updatedAt: string;
}
