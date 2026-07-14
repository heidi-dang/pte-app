import type { SimilarityCheck, SimilarityProviderId } from '@pte-app/contracts';

export interface SimilarityResult {
  score: number;
  matchedSources: string[];
  evidence: string;
}

export interface SimilarityProvider {
  readonly providerId: SimilarityProviderId;
  readonly profileVersion: string;
  checkContent(content: string, contentId: string, versionId: string): Promise<SimilarityCheck>;
  healthCheck(): Promise<boolean>;
}

export class LocalTestSimilarityProvider implements SimilarityProvider {
  readonly providerId: SimilarityProviderId = 'local_test';
  readonly profileVersion = '1.0.0';

  async checkContent(content: string, contentId: string, versionId: string): Promise<SimilarityCheck> {
    const now = new Date().toISOString();
    const score = content.length > 0 ? Math.random() * 30 : 0;
    return {
      id: crypto.randomUUID() as any,
      contentId: contentId as any,
      contentVersionId: versionId as any,
      providerId: this.providerId,
      profileVersion: this.profileVersion,
      status: 'completed',
      similarityScore: score,
      matchedSources: score > 10 ? ['local-test-reference'] : [],
      completedAt: now,
      error: null,
      evidenceSnapshot: JSON.stringify({ contentLength: content.length, score }),
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
