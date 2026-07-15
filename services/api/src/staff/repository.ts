import type {
  TeacherAssignment,
  TeacherStudentAssignment,
  TeacherFeedback,
  StaffUserAdminAction,
  ImpersonationSession,
} from '@pte-app/contracts';

export interface StaffRepository {
  findAssignments(teacherId: string): Promise<TeacherAssignment[]>;
  findStudents(teacherId: string): Promise<TeacherStudentAssignment[]>;
  findFeedback(attemptId: string): Promise<TeacherFeedback | null>;
  upsertFeedback(feedback: TeacherFeedback): Promise<void>;
  insertAdminAction(action: StaffUserAdminAction): Promise<void>;
  insertImpersonation(session: ImpersonationSession): Promise<void>;
}
