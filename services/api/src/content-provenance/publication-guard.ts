import type { DatabaseConnection } from '@pte-app/database';
import {
  sources,
  licences,
  provenanceRepo,
  evidenceRepo,
  similarityRepo,
  prohibitedMatchRepo,
  publicationDecisionRepo,
  policyRepo,
  contentAuditRepo,
} from '@pte-app/database';
import type {
  ContentId,
  ContentVersionId,
  UserId,
  RequestId,
  PublicationDecisionId,
  ProvenancePolicy,
  AuditEventType,
  BlockerCode,
  PublicationBlocker,
  ProhibitedRuleMatch,
} from '@pte-app/contracts';
import { evaluatePublicationEligibility } from '@pte-app/domain';

export interface PublicationGuardResult {
  eligible: boolean;
  decisionId: string;
  blockers: readonly PublicationBlocker[];
  warnings: readonly string[];
}

export async function requirePublicationEligibility(
  db: DatabaseConnection,
  actor: UserId,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
  requestId: RequestId,
): Promise<PublicationGuardResult> {
  const policy = await policyRepo.getActivePolicy(db);
  if (!policy) {
    throw new Error('No active provenance policy found');
  }

  const provenance = (await provenanceRepo.getProvenanceForContentVersion(db, contentId, contentVersionId)) ?? null;

  let source = null;
  let licence = null;
  let similarity = null;
  let prohibitedMatches: readonly ProhibitedRuleMatch[] = [];

  if (provenance) {
    source = (await sources.getSourceById(db, provenance.sourceId)) ?? null;
    licence = provenance.licenceId ? ((await licences.getLicenceById(db, provenance.licenceId)) ?? null) : null;

    if (provenance.similarityCheckId) {
      similarity = (await similarityRepo.getSimilarityCheckById(db, provenance.similarityCheckId)) ?? null;
    }

    prohibitedMatches = await prohibitedMatchRepo.listActiveMatchesForContent(db, contentId, contentVersionId);
  }

  const evidence = provenance?.evidenceIds?.length
    ? await evidenceRepo.listEvidenceForContent(db, [...provenance.evidenceIds])
    : [];

  const invalidEvidence = evidence.filter((e) => e.status === 'invalid');
  if (invalidEvidence.length > 0 && provenance) {
    const blockers: PublicationBlocker[] = [
      { code: 'EVIDENCE_INVALID' as BlockerCode, message: 'One or more evidence records are invalid' },
    ];
    const decisionId = await persistDecision(
      db,
      contentId,
      contentVersionId,
      provenance.id,
      policy,
      false,
      blockers,
      [],
      actor,
      requestId,
    );
    await emitAuditEvent(
      db,
      'publication_blocked' as AuditEventType,
      actor,
      requestId,
      'content',
      contentId as string,
      policy,
      'Evidence invalid',
    );
    return { eligible: false, decisionId, blockers, warnings: [] };
  }

  const result = evaluatePublicationEligibility({
    provenance,
    source,
    licence,
    similarity,
    policy,
    contentVersionId,
    prohibitedMatches,
  });

  const decisionId = await persistDecision(
    db,
    contentId,
    contentVersionId,
    provenance?.id ?? ('' as any),
    policy,
    result.eligible,
    [...result.blockers],
    [...result.warnings],
    actor,
    requestId,
  );

  const eventType = (result.eligible ? 'publication_allowed' : 'publication_blocked') as AuditEventType;
  await emitAuditEvent(
    db,
    eventType,
    actor,
    requestId,
    'content',
    contentId as string,
    policy,
    result.eligible ? 'eligible' : `blocked: ${result.blockers.map((b) => b.code).join(', ')}`,
  );

  return {
    eligible: result.eligible,
    decisionId,
    blockers: result.blockers,
    warnings: result.warnings,
  };
}

async function persistDecision(
  db: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
  provenanceRecordId: any,
  policy: ProvenancePolicy,
  eligible: boolean,
  blockers: PublicationBlocker[],
  warnings: string[],
  actor: UserId,
  requestId: RequestId,
): Promise<string> {
  const id = crypto.randomUUID() as PublicationDecisionId;
  const decision = await publicationDecisionRepo.createPublicationDecision(db, {
    id,
    contentId,
    contentVersionId,
    provenanceRecordId,
    policyId: policy.id,
    policyVersion: policy.version,
    eligible,
    blockers,
    warnings,
    actor,
    requestId,
  });
  return decision.id;
}

async function emitAuditEvent(
  db: DatabaseConnection,
  eventType: AuditEventType,
  actor: UserId,
  requestId: RequestId,
  entityType: string,
  entityId: string,
  policy: ProvenancePolicy,
  result: string,
): Promise<void> {
  await contentAuditRepo.createContentAuditEvent(db, {
    eventType,
    actor,
    requestId,
    entityType,
    entityId,
    previousVersion: null,
    newVersion: null,
    reason: null,
    policyId: policy.id,
    policyVersion: policy.version,
    result,
  });
}
