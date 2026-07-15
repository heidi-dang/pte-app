export interface TeacherAssignment {
  id: string;
  teacherId: string;
  title: string;
  instructions: string;
  contentReferences: string[];
  assignedStudentIds: string[];
  dueDateProfile: { dueAt: string; allowLateSubmission: boolean; lateCutoffAt?: string };
  availabilityPeriod: { startAt: string; endAt: string };
  completionPolicy: 'all' | 'minimum' | 'optional';
  version: number;
  status: 'draft' | 'published' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentTarget {
  assignmentId: string;
  studentId: string;
  status: 'assigned' | 'started' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  responseReferences: string[];
}
