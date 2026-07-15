import type { DatabaseConnection } from '../client.js';
import type {
  PublicationDecision,
  PublicationDecisionId,
  ContentId,
  ContentVersionId,
  ProvenanceId,
  PolicyId,
  PolicyVersion,
  UserId,
  RequestId,
  PublicationBlocker,
} from '@pte-app/contracts';

export async function createPublicationDecision(
  connection: DatabaseConnection,
  input: {
    id: PublicationDecisionId;
    contentId: ContentId;
    contentVersionId: ContentVersionId;
    provenanceRecordId: ProvenanceId | null;
    policyId: PolicyId;
    policyVersion: PolicyVersion;
    eligible: boolean;
    blockers: PublicationBlocker[];
    warnings: string[];
    actor: UserId;
    requestId: RequestId;
  },
): Promise<PublicationDecision> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_publication_decisions
      (id, provenance_id, content_id, content_version_id, eligible, policy_version,
       blockers, warnings, decision_snapshot, actor_id, request_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11)
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               provenance_id as "provenanceRecordId", policy_version as "policyVersion",
               eligible, blockers, warnings, actor_id as "actor", request_id as "requestId",
               evaluated_at as "evaluatedAt"`,
    [
      input.id,
      input.provenanceRecordId,
      input.contentId,
      input.contentVersionId,
      input.eligible,
      input.policyVersion,
      JSON.stringify(input.blockers),
      JSON.stringify(input.warnings),
      JSON.stringify({
        policyId: input.policyId,
        policyVersion: input.policyVersion,
        eligible: input.eligible,
        blockers: input.blockers,
        warnings: input.warnings,
      }),
      input.actor,
      input.requestId,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create publication decision');
  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: row.id as PublicationDecisionId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    provenanceRecordId: (row.provenanceRecordId as ProvenanceId) ?? null,
    policyId: input.policyId,
    policyVersion: row.policyVersion as PolicyVersion,
    eligible: row.eligible as boolean,
    blockers: row.blockers as PublicationBlocker[],
    warnings: row.warnings as string[],
    actor: row.actor as UserId,
    requestId: row.requestId as RequestId,
    evaluatedAt: row.evaluatedAt as string,
  };
}

export async function getPublicationDecisionById(
  connection: DatabaseConnection,
  id: PublicationDecisionId,
): Promise<PublicationDecision | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            provenance_id as "provenanceRecordId", policy_version as "policyVersion",
            eligible, blockers, warnings, actor_id as "actor", request_id as "requestId",
            evaluated_at as "evaluatedAt"
     FROM content_publication_decisions WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as PublicationDecisionId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    provenanceRecordId: (row.provenanceRecordId as ProvenanceId) ?? null,
    policyId: '' as PolicyId,
    policyVersion: row.policyVersion as PolicyVersion,
    eligible: row.eligible as boolean,
    blockers: row.blockers as PublicationBlocker[],
    warnings: row.warnings as string[],
    actor: row.actor as UserId,
    requestId: row.requestId as RequestId,
    evaluatedAt: row.evaluatedAt as string,
  };
}

export async function listDecisionsForContent(
  connection: DatabaseConnection,
  contentId: ContentId,
): Promise<PublicationDecision[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            provenance_id as "provenanceRecordId", policy_version as "policyVersion",
            eligible, blockers, warnings, actor_id as "actor", request_id as "requestId",
            evaluated_at as "evaluatedAt"
     FROM content_publication_decisions
     WHERE content_id = $1
     ORDER BY evaluated_at DESC`,
    [contentId],
  );
  return result.rows.map((row) => ({
    id: row.id as PublicationDecisionId,
    contentId: row.contentId as ContentId,
    contentVersionId: row.contentVersionId as ContentVersionId,
    provenanceRecordId: (row.provenanceRecordId as ProvenanceId) ?? null,
    policyId: '' as PolicyId,
    policyVersion: row.policyVersion as PolicyVersion,
    eligible: row.eligible as boolean,
    blockers: row.blockers as PublicationBlocker[],
    warnings: row.warnings as string[],
    actor: row.actor as UserId,
    requestId: row.requestId as RequestId,
    evaluatedAt: row.evaluatedAt as string,
  }));
}
