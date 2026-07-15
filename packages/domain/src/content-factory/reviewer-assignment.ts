export function canAssignReviewer(
  reviewerId: string,
  authorId: string,
  existingAssignments: string[],
  maxWorkload: number,
): { allowed: boolean; reason?: string } {
  if (reviewerId === authorId) return { allowed: false, reason: 'Reviewer cannot be the author' };
  if (existingAssignments.length >= maxWorkload) return { allowed: false, reason: 'Reviewer at maximum workload' };
  return { allowed: true };
}
