export interface DuplicateDetectionProfile {
  id: string;
  version: number;
  textSimilarityThreshold: number;
  mediaFingerprintEnabled: boolean;
  exactMatchRequired: boolean;
  includeNearDuplicates: boolean;
  humanResolutionRequired: boolean;
}

export interface DuplicateMatch {
  id: string;
  contentId: string;
  matchedContentId: string;
  matchType: 'exact' | 'near' | 'related';
  similarityScore: number;
  status: 'unresolved' | 'confirmed' | 'false-positive';
  resolution?: 'keep' | 'flag' | 'reject';
  resolvedById?: string;
  resolvedAt?: string;
}
