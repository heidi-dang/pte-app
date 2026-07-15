import type { TeacherStudentAssignment } from '@pte-app/contracts';

export function isAssignedTeacher(
  assignments: TeacherStudentAssignment[],
  teacherId: string,
  studentId: string,
): boolean {
  return assignments.some((a) => a.teacherId === teacherId && a.studentId === studentId && a.status === 'active');
}

export function getAccessibleStudents(assignments: TeacherStudentAssignment[], teacherId: string): string[] {
  return assignments.filter((a) => a.teacherId === teacherId && a.status === 'active').map((a) => a.studentId);
}
