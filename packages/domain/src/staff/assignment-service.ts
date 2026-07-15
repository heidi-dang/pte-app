import type { TeacherAssignment, AssignmentTarget } from '@pte-app/contracts';

export function createAssignment(teacherId: string, title: string, instructions: string): TeacherAssignment {
  return {
    id: crypto.randomUUID(),
    teacherId,
    title,
    instructions,
    contentReferences: [],
    assignedStudentIds: [],
    dueDateProfile: { dueAt: '', allowLateSubmission: false },
    availabilityPeriod: { startAt: new Date().toISOString(), endAt: '' },
    completionPolicy: 'all',
    version: 1,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function publishAssignment(assignment: TeacherAssignment): TeacherAssignment {
  return { ...assignment, status: 'published', updatedAt: new Date().toISOString() };
}

export function archiveAssignment(assignment: TeacherAssignment): TeacherAssignment {
  return { ...assignment, status: 'archived', updatedAt: new Date().toISOString() };
}
