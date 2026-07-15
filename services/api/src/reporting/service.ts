import type {
  Dashboard,
  StudentDashboard,
  ReportFilter,
  ExportRequest,
  ExportJob,
  ScoreTrendSet,
  MasterySnapshot,
} from '@pte-app/contracts';
import type { ReportingRepository } from './repository.js';

export class ReportingService {
  constructor(private repo: ReportingRepository) {}

  async getDashboard(userId: string): Promise<Dashboard> {
    return this.repo.findDashboard(userId);
  }

  async getStudentDashboard(userId: string): Promise<StudentDashboard> {
    return this.repo.findStudentDashboard(userId);
  }

  async getScoreTrend(userId: string, filter: ReportFilter): Promise<ScoreTrendSet> {
    return this.repo.findScoreTrend(userId, filter);
  }

  async getMastery(userId: string): Promise<MasterySnapshot> {
    return this.repo.findMastery(userId);
  }

  async createExportJob(userId: string, request: ExportRequest): Promise<ExportJob> {
    return this.repo.createExport(userId, request);
  }

  async getExportJob(jobId: string): Promise<ExportJob | null> {
    return this.repo.findExportJob(jobId);
  }
}
