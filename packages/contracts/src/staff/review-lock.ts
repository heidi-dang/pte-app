export interface ReviewLock {
  id: string;
  reviewId: string;
  ownerId: string;
  acquiredAt: string;
  expiresAt: string;
  renewedAt?: string;
  releasedAt?: string;
  status: 'active' | 'expired' | 'released' | 'taken-over';
  takeoverHistory: Array<{ previousOwnerId: string; newOwnerId: string; timestamp: string }>;
}
