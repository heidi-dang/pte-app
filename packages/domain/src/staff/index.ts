export { hasCapability } from './permission-policy.js';
export { isAssignedTeacher, getAccessibleStudents } from './teacher-student-access.js';
export { createFeedbackVersion } from './feedback-versioning.js';
export { acquireLock, isLockExpired, canTakeOver } from './review-lock.js';
export { createConfirmation, isConfirmationStale } from './sensitive-action.js';
export { canStartImpersonation, isImpersonationExpired } from './impersonation-policy.js';
