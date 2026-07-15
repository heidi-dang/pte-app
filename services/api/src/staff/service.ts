import type {
  TeacherAssignment,
  TeacherStudentAssignment,
  TeacherFeedback,
  StaffUserAdminAction,
  ImpersonationSession,
} from '@pte-app/contracts';
import type { StaffRepository } from './repository.js';

export class StaffService {
  constructor(private repo: StaffRepository) {}

  async getAssignments(teacherId: string): Promise<TeacherAssignment[]> {
    return this.repo.findAssignments(teacherId);
  }

  async getStudents(teacherId: string): Promise<TeacherStudentAssignment[]> {
    return this.repo.findStudents(teacherId);
  }

  async getFeedback(attemptId: string): Promise<TeacherFeedback | null> {
    return this.repo.findFeedback(attemptId);
  }

  async saveFeedback(feedback: TeacherFeedback): Promise<void> {
    return this.repo.upsertFeedback(feedback);
  }

  async recordAdminAction(action: StaffUserAdminAction): Promise<void> {
    return this.repo.insertAdminAction(action);
  }

  async startImpersonation(session: ImpersonationSession): Promise<void> {
    return this.repo.insertImpersonation(session);
  }
}
