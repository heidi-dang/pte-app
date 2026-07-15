import { withTransaction } from '@pte-app/database';
import {
  sources,
  licences,
  provenanceRepo,
  evidenceRepo,
  prohibitedMatchRepo,
  policyRepo,
  similarityRepo,
  publicationDecisionRepo,
} from '@pte-app/database';
import type {
  ContentId,
  ContentVersionId,
  ProvenanceId,
  UserId,
  RequestId,
  PublicationDecisionId,
  ProvenancePolicy,
  BlockerCode,
  PublicationBlocker,
  ProhibitedRuleMatch,
  EvidenceRecord,
  ProvenanceRecord,
  SimilarityCheck,
  SourceRecord,
  LicenceRecord,
} from '@pte-app/contracts';
import { evaluatePublicationEligibility } from '@pte-app/domain';
import type { DatabaseConnection, DatabaseClient } from '@pte-app/database';

export interface PublicationGuardResult {
  eligible: boolean;
  decisionId: PublicationDecisionId;
  blockers: readonly PublicationBlocker[];
  warnings: readonly string[];
}

function validateEvidenceCompleteness(
  evidence: readonly EvidenceRecord[],
  provenance: ProvenanceRecord | null,
  policy: ProvenancePolicy,
): PublicationBlocker[] {
  const blockers: PublicationBlocker[] = [];
  if (!provenance) return blockers;

  const evidenceMap = new Map(evidence.map((e) => [e.id as string, e]));

  for (const evId of provenance.evidenceIds) {
    const ev = evidenceMap.get(evId as string);
    if (!ev) {
      blockers.push({
        code: 'EVIDENCE_NOT_FOUND' as BlockerCode,
        message: `Referenced evidence ${evId} not found`,
      });
      continue;
    }
    if (ev.status === 'invalid') {
      blockers.push({
        code: 'EVIDENCE_INVALID' as BlockerCode,
        message: `Evidence ${evId} is invalid`,
      });
    }
    if (ev.status === 'superseded') {
      blockers.push({
        code: 'EVIDENCE_SUPERSEDED' as BlockerCode,
        message: `Evidence ${evId} has been superseded`,
      });
    }
    if (!ev.checksum || ev.checksum.length === 0) {
      blockers.push({
        code: 'EVIDENCE_RETENTION_INVALID' as BlockerCode,
        message: `Evidence ${evId} has missing checksum`,
      });
    }
    const retentionDate = new Date(ev.retainedUntil);
    if (isNaN(retentionDate.getTime())) {
      blockers.push({
        code: 'EVIDENCE_RETENTION_INVALID' as BlockerCode,
        message: `Evidence ${evId} has invalid retention date`,
      });
    }
  }

  if (provenance.ownershipType) {
    const requiredTypes =
      (policy.requiredEvidenceByOwnership as Record<string, readonly string[]>)[provenance.ownershipType] ?? [];
    for (const requiredType of requiredTypes) {
      const hasType = evidence.some((e) => e.evidenceType === requiredType);
      if (!hasType) {
        blockers.push({
          code: 'EVIDENCE_REQUIRED_TYPE_MISSING' as BlockerCode,
          message: `Required evidence type ${requiredType} is missing for ownership type ${provenance.ownershipType}`,
        });
      }
    }
  }

  return blockers;
}

async function loadDependencies(
  db: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
): Promise<{
  provenance: ProvenanceRecord | null;
  source: SourceRecord | null;
  licence: LicenceRecord | null;
  similarity: SimilarityCheck | null;
  evidence: readonly EvidenceRecord[];
  prohibitedMatches: readonly ProhibitedRuleMatch[];
}> {
  const provenance = (await provenanceRepo.getProvenanceForContentVersion(db, contentId, contentVersionId)) ?? null;

  let source: SourceRecord | null = null;
  let licence: LicenceRecord | null = null;
  let similarity: SimilarityCheck | null = null;
  let evidence: readonly EvidenceRecord[] = [];
  let prohibitedMatches: readonly ProhibitedRuleMatch[] = [];

  if (provenance) {
    source = (await sources.getSourceById(db, provenance.sourceId)) ?? null;
    licence = provenance.licenceId ? ((await licences.getLicenceById(db, provenance.licenceId)) ?? null) : null;
    similarity = provenance.similarityCheckId
      ? ((await similarityRepo.getSimilarityCheckById(db, provenance.similarityCheckId)) ?? null)
      : null;
    evidence = provenance.evidenceIds.length
      ? await evidenceRepo.listEvidenceForContent(db, [...provenance.evidenceIds])
      : [];
    prohibitedMatches = await prohibitedMatchRepo.listActiveMatchesForContent(db, contentId, contentVersionId);
  }

  return { provenance, source, licence, similarity, evidence, prohibitedMatches };
}

export async function requirePublicationEligibility(
  db: DatabaseConnection,
  actor: UserId,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
  requestId: RequestId,
): Promise<PublicationGuardResult> {
  const existing = await publicationDecisionRepo.getPublicationDecisionByRequestId(
    db,
    requestId,
    contentId,
    contentVersionId,
  );
  if (existing) {
    return {
      eligible: existing.eligible,
      decisionId: existing.id,
      blockers: existing.blockers,
      warnings: existing.warnings,
    };
  }

  const policy = await policyRepo.getActivePolicy(db);
  if (!policy) {
    throw new Error('No active provenance policy found');
  }

  const { provenance, source, licence, similarity, evidence, prohibitedMatches } = await loadDependencies(
    db,
    contentId,
    contentVersionId,
  );

  const evidenceBlockers = validateEvidenceCompleteness(evidence, provenance, policy);
  if (evidenceBlockers.length > 0 && provenance) {
    return executeAtomicDecision(
      db,
      contentId,
      contentVersionId,
      provenance.id,
      policy,
      false,
      evidenceBlockers,
      [],
      actor,
      requestId,
      'publication_blocked',
      `blocked: ${evidenceBlockers.map((b) => b.code).join(', ')}`,
    );
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

  const provenanceRecordId: ProvenanceId | null = provenance?.id ?? null;
  const eventType = result.eligible ? 'publication_allowed' : 'publication_blocked';
  const auditResult = result.eligible ? 'eligible' : `blocked: ${result.blockers.map((b) => b.code).join(', ')}`;

  return executeAtomicDecision(
    db,
    contentId,
    contentVersionId,
    provenanceRecordId,
    policy,
    result.eligible,
    [...result.blockers],
    [...result.warnings],
    actor,
    requestId,
    eventType,
    auditResult,
  );
}

async function executeAtomicDecision(
  db: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
  provenanceRecordId: ProvenanceId | null,
  policy: ProvenancePolicy,
  eligible: boolean,
  blockers: PublicationBlocker[],
  warnings: string[],
  actor: UserId,
  requestId: RequestId,
  eventType: string,
  auditResult: string,
): Promise<PublicationGuardResult> {
  const decisionId = crypto.randomUUID() as PublicationDecisionId;
  const auditId = crypto.randomUUID();

  const PG_UNIQUE_VIOLATION = '23505';

  try {
    await withTransaction(db, async (client: DatabaseClient) => {
      await client.query(
        `INSERT INTO content_publication_decisions
       (id, provenance_id, content_id, content_version_id, eligible, policy_version,
        blockers, warnings, decision_snapshot, actor_id, request_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11)`,
        [
          decisionId,
          provenanceRecordId,
          contentId,
          contentVersionId,
          eligible,
          policy.version,
          JSON.stringify(blockers),
          JSON.stringify(warnings),
          JSON.stringify({
            policyId: policy.id,
            policyVersion: policy.version,
            eligible,
            blockers,
            warnings,
          }),
          actor,
          requestId,
        ],
      );

      await client.query(
        `INSERT INTO content_audit_events
       (id, event_type, actor_id, request_id, entity_type, entity_id,
        previous_version, new_version, reason, policy_id, policy_version, result)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          auditId,
          eventType,
          actor,
          requestId,
          'content',
          contentId as string,
          null,
          null,
          null,
          policy.id,
          policy.version,
          auditResult,
        ],
      );
    });

    return {
      eligible,
      decisionId,
      blockers,
      warnings,
    };
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === PG_UNIQUE_VIOLATION) {
      const existing = await publicationDecisionRepo.getPublicationDecisionByRequestId(
        db,
        requestId,
        contentId,
        contentVersionId,
      );
      if (existing) {
        return {
          eligible: existing.eligible,
          decisionId: existing.id,
          blockers: existing.blockers,
          warnings: existing.warnings,
        };
      }
      throw new Error('Concurrent idempotency conflict — existing decision not found', { cause: err });
    }
    throw new Error('Publication decision persistence failed', { cause: err });
  }
}
