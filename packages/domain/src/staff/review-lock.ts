import type { ReviewLock } from '@pte-app/contracts';

export function acquireLock(reviewId: string, ownerId: string, ttlMs: number): ReviewLock {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    reviewId,
    ownerId,
    acquiredAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    status: 'active',
    takeoverHistory: [],
  };
}

export function isLockExpired(lock: ReviewLock): boolean {
  return new Date(lock.expiresAt) < new Date();
}

export function canTakeOver(lock: ReviewLock, callerCapabilities: string[]): boolean {
  return isLockExpired(lock) || callerCapabilities.includes('teacher.feedback.lock');
}
