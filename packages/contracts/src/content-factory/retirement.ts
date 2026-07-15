export interface ContentRetirement {
  id: string;
  contentVersionId: string;
  reason: string;
  replacementContentId?: string;
  status: 'active' | 'retired';
  retiredAt?: string;
  retiredById?: string;
}
