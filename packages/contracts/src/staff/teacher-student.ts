export interface TeacherStudentAssignment {
  id: string;
  teacherId: string;
  studentId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'expired' | 'removed';
  auditHistory: Array<{ action: string; timestamp: string; actorId: string }>;
  createdAt: string;
  updatedAt: string;
}
