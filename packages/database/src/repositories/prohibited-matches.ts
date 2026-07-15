import type { DatabaseConnection } from '../client.js';
import type { ProhibitedRuleMatch, ProhibitedMatchId, ContentId, ContentVersionId, UserId } from '@pte-app/contracts';

export async function createProhibitedMatch(
  connection: DatabaseConnection,
  input: {
    id: ProhibitedMatchId;
    contentId: ContentId;
    contentVersionId: ContentVersionId;
    ruleName: string;
    matchedBy: UserId;
    reason: string;
  },
): Promise<ProhibitedRuleMatch> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_prohibited_matches (id, content_id, content_version_id, rule_name, matched_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               rule_name as "ruleName", matched_at as "matchedAt", matched_by as "matchedBy",
               resolved, resolved_at as "resolvedAt", resolved_by as "resolvedBy", reason`,
    [input.id, input.contentId, input.contentVersionId, input.ruleName, input.matchedBy, input.reason],
  );
  if (!result.rows[0]) throw new Error('Failed to create prohibited match');
  return result.rows[0] as unknown as ProhibitedRuleMatch;
}

export async function listActiveMatchesForContent(
  connection: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
): Promise<ProhibitedRuleMatch[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            rule_name as "ruleName", matched_at as "matchedAt", matched_by as "matchedBy",
            resolved, resolved_at as "resolvedAt", resolved_by as "resolvedBy", reason
     FROM content_prohibited_matches
     WHERE content_id = $1 AND content_version_id = $2 AND resolved = false
     ORDER BY matched_at DESC`,
    [contentId, contentVersionId],
  );
  return result.rows as unknown as ProhibitedRuleMatch[];
}

export async function listAllMatchesForContent(
  connection: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
): Promise<ProhibitedRuleMatch[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            rule_name as "ruleName", matched_at as "matchedAt", matched_by as "matchedBy",
            resolved, resolved_at as "resolvedAt", resolved_by as "resolvedBy", reason
     FROM content_prohibited_matches
     WHERE content_id = $1 AND content_version_id = $2
     ORDER BY matched_at DESC`,
    [contentId, contentVersionId],
  );
  return result.rows as unknown as ProhibitedRuleMatch[];
}

export async function resolveProhibitedMatch(
  connection: DatabaseConnection,
  id: ProhibitedMatchId,
  resolvedBy: UserId,
  reason: string,
): Promise<ProhibitedRuleMatch | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_prohibited_matches
     SET resolved = true, resolved_at = NOW(), resolved_by = $2, reason = COALESCE($3, reason)
     WHERE id = $1
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               rule_name as "ruleName", matched_at as "matchedAt", matched_by as "matchedBy",
               resolved, resolved_at as "resolvedAt", resolved_by as "resolvedBy", reason`,
    [id, resolvedBy, reason],
  );
  return result.rows[0] as unknown as ProhibitedRuleMatch | undefined;
}
