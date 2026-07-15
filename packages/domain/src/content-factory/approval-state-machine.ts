export function canSelfApprove(isAuthor: boolean, preventSelfApproval: boolean): { allowed: boolean; reason?: string } {
  if (isAuthor && preventSelfApproval) {
    return { allowed: false, reason: 'Author cannot approve own content' };
  }
  return { allowed: true };
}
