import type {
  Dashboard,
  StudentDashboard,
  ReportFilter,
  ExportRequest,
  ExportJob,
  ScoreTrendSet,
  MasterySnapshot,
} from '@pte-app/contracts';

export interface ReportingRepository {
  findDashboard(userId: string): Promise<Dashboard>;
  findStudentDashboard(userId: string): Promise<StudentDashboard>;
  findScoreTrend(userId: string, filter: ReportFilter): Promise<ScoreTrendSet>;
  findMastery(userId: string): Promise<MasterySnapshot>;
  createExport(userId: string, request: ExportRequest): Promise<ExportJob>;
  findExportJob(jobId: string): Promise<ExportJob | null>;
}
