import type { DatabaseConnection } from '../client.js';
import type {
  SimilarityCheck,
  SimilarityCheckId,
  ContentId,
  ContentVersionId,
  SimilarityProviderId,
} from '@pte-app/contracts';

export async function createSimilarityCheck(
  connection: DatabaseConnection,
  input: {
    id: SimilarityCheckId;
    contentId: ContentId;
    contentVersionId: ContentVersionId;
    providerId: SimilarityProviderId;
    profileVersion: string;
    evidenceSnapshot: string;
  },
): Promise<SimilarityCheck> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_similarity_checks (id, content_id, content_version_id, provider_id, profile_version, evidence_snapshot)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               provider_id as "providerId", profile_version as "profileVersion",
               status, similarity_score as "similarityScore",
               matched_sources as "matchedSources", completed_at as "completedAt",
               error, evidence_snapshot as "evidenceSnapshot"`,
    [input.id, input.contentId, input.contentVersionId, input.providerId, input.profileVersion, input.evidenceSnapshot],
  );
  if (!result.rows[0]) throw new Error('Failed to create similarity check');
  return result.rows[0] as unknown as SimilarityCheck;
}

export async function getSimilarityCheckById(
  connection: DatabaseConnection,
  id: SimilarityCheckId,
): Promise<SimilarityCheck | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            provider_id as "providerId", profile_version as "profileVersion",
            status, similarity_score as "similarityScore",
            matched_sources as "matchedSources", completed_at as "completedAt",
            error, evidence_snapshot as "evidenceSnapshot"
     FROM content_similarity_checks WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as SimilarityCheckId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    providerId: row.providerId as SimilarityProviderId,
    profileVersion: row.profileVersion as string,
    status: row.status as SimilarityCheck['status'],
    similarityScore: row.similarityScore as number | null,
    matchedSources: row.matchedSources as string[],
    completedAt: row.completedAt as string | null,
    error: row.error as string | null,
    evidenceSnapshot: row.evidenceSnapshot as string,
  };
}

export async function completeSimilarityCheck(
  connection: DatabaseConnection,
  id: SimilarityCheckId,
  result: { similarityScore: number; matchedSources: string[] },
): Promise<SimilarityCheck | undefined> {
  const res = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_similarity_checks
     SET status = 'completed', similarity_score = $2, matched_sources = $3::jsonb, completed_at = NOW()
     WHERE id = $1
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               provider_id as "providerId", profile_version as "profileVersion",
               status, similarity_score as "similarityScore",
               matched_sources as "matchedSources", completed_at as "completedAt",
               error, evidence_snapshot as "evidenceSnapshot"`,
    [id, result.similarityScore, JSON.stringify(result.matchedSources)],
  );
  if (!res.rows[0]) return undefined;
  const row = res.rows[0];
  return {
    id: row.id as SimilarityCheckId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    providerId: row.providerId as SimilarityProviderId,
    profileVersion: row.profileVersion as string,
    status: 'completed',
    similarityScore: row.similarityScore as number,
    matchedSources: row.matchedSources as string[],
    completedAt: row.completedAt as string,
    error: null,
    evidenceSnapshot: row.evidenceSnapshot as string,
  };
}

export async function failSimilarityCheck(
  connection: DatabaseConnection,
  id: SimilarityCheckId,
  error: string,
): Promise<SimilarityCheck | undefined> {
  const res = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_similarity_checks
     SET status = 'failed', error = $2
     WHERE id = $1
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               provider_id as "providerId", profile_version as "profileVersion",
               status, similarity_score as "similarityScore",
               matched_sources as "matchedSources", completed_at as "completedAt",
               error, evidence_snapshot as "evidenceSnapshot"`,
    [id, error],
  );
  if (!res.rows[0]) return undefined;
  const row = res.rows[0];
  return {
    id: row.id as SimilarityCheckId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    providerId: row.providerId as SimilarityProviderId,
    profileVersion: row.profileVersion as string,
    status: 'failed',
    similarityScore: null,
    matchedSources: row.matchedSources as string[],
    completedAt: null,
    error: row.error as string,
    evidenceSnapshot: row.evidenceSnapshot as string,
  };
}
