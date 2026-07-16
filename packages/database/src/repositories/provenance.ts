import type { DatabaseConnection } from '../client.js';
import type {
  ProvenanceRecord,
  ProvenanceId,
  ContentId,
  ContentVersionId,
  SourceId,
  LicenceId,
  UserId,
  OwnershipType,
  VerificationStatus,
} from '@pte-app/contracts';
import { VALID_PROVENANCE_TRANSITIONS } from '@pte-app/contracts';

export async function createProvenance(
  connection: DatabaseConnection,
  input: {
    id: ProvenanceId;
    contentId: ContentId;
    contentVersionId: ContentVersionId;
    sourceId: SourceId;
    licenceId: LicenceId | null;
    ownershipType: OwnershipType;
    attribution: string;
    evidenceIds: string[];
    createdBy: UserId;
  },
): Promise<ProvenanceRecord> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_provenance (id, content_id, content_version_id, source_id, licence_id, ownership_type, verification_status, publication_status, attribution, evidence_ids, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'draft','blocked',$7,$8::uuid[],$9)
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
               verification_status as "verificationStatus", publication_status as "publicationStatus",
               attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
               created_by as "createdBy", reviewed_by as "reviewedBy",
               created_at as "createdAt", updated_at as "updatedAt",
               verified_at as "verifiedAt", expires_at as "expiresAt",
               supersedes, version`,
    [
      input.id,
      input.contentId,
      input.contentVersionId,
      input.sourceId,
      input.licenceId,
      input.ownershipType,
      input.attribution,
      input.evidenceIds,
      input.createdBy,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create provenance');
  return result.rows[0] as unknown as ProvenanceRecord;
}

export async function getProvenanceById(
  connection: DatabaseConnection,
  id: ProvenanceId,
): Promise<ProvenanceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
            verification_status as "verificationStatus", publication_status as "publicationStatus",
            attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
            created_by as "createdBy", reviewed_by as "reviewedBy",
            created_at as "createdAt", updated_at as "updatedAt",
            verified_at as "verifiedAt", expires_at as "expiresAt",
            supersedes, version
     FROM content_provenance WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as ProvenanceRecord;
}

export async function getProvenanceForContentVersion(
  connection: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
): Promise<ProvenanceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
            verification_status as "verificationStatus", publication_status as "publicationStatus",
            attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
            created_by as "createdBy", reviewed_by as "reviewedBy",
            created_at as "createdAt", updated_at as "updatedAt",
            verified_at as "verifiedAt", expires_at as "expiresAt",
            supersedes, version
     FROM content_provenance
     WHERE content_id = $1 AND content_version_id = $2
     ORDER BY version DESC
     LIMIT 1`,
    [contentId, contentVersionId],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as ProvenanceRecord;
}

export async function countProvenanceForContentVersion(
  connection: DatabaseConnection,
  contentId: ContentId,
  contentVersionId: ContentVersionId,
): Promise<number> {
  const result = await connection.pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM content_provenance
     WHERE content_id = $1 AND content_version_id = $2`,
    [contentId, contentVersionId],
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

export async function updateProvenanceStatus(
  connection: DatabaseConnection,
  id: ProvenanceId,
  status: VerificationStatus,
  reviewedBy?: UserId,
  reason?: string,
  expectedVersion?: number,
): Promise<ProvenanceRecord | undefined> {
  if (expectedVersion !== undefined) {
    const current = await getProvenanceById(connection, id);
    if (!current) return undefined;
    if (current.version !== expectedVersion) return undefined;
    const allowed = VALID_PROVENANCE_TRANSITIONS[current.verificationStatus] as readonly string[];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid transition: ${current.verificationStatus} → ${status}. Allowed: ${allowed.join(', ')}`);
    }
  }

  const setClauses = ['verification_status = $2', 'updated_at = NOW()'];
  const values: unknown[] = [id, status];
  const idx = 3;

  if (reviewedBy) {
    setClauses.push(`reviewed_by = $${idx}`);
    values.push(reviewedBy);
  }
  if (status === 'verified') {
    setClauses.push(`verified_at = NOW()`);
  }
  if (expectedVersion !== undefined) {
    setClauses.push(`version = version + 1`);
  }

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_provenance SET ${setClauses.join(', ')} WHERE id = $1
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
               verification_status as "verificationStatus", publication_status as "publicationStatus",
               attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
               created_by as "createdBy", reviewed_by as "reviewedBy",
               created_at as "createdAt", updated_at as "updatedAt",
               verified_at as "verifiedAt", expires_at as "expiresAt",
               supersedes, version`,
    values,
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as ProvenanceRecord;
}

export async function updateProvenance(
  connection: DatabaseConnection,
  id: ProvenanceId,
  input: {
    sourceId?: SourceId;
    licenceId?: LicenceId | null;
    ownershipType?: OwnershipType;
    attribution?: string;
    evidenceIds?: string[];
  },
  expectedVersion: number,
): Promise<ProvenanceRecord | undefined> {
  const current = await getProvenanceById(connection, id);
  if (!current) return undefined;
  if (current.version !== expectedVersion) return undefined;
  if (current.verificationStatus !== 'draft' && current.verificationStatus !== 'rejected') {
    throw new Error(`Cannot update provenance in ${current.verificationStatus} status`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.sourceId !== undefined) {
    fields.push(`source_id = $${idx++}`);
    values.push(input.sourceId);
  }
  if (input.licenceId !== undefined) {
    fields.push(`licence_id = $${idx++}`);
    values.push(input.licenceId);
  }
  if (input.ownershipType !== undefined) {
    fields.push(`ownership_type = $${idx++}`);
    values.push(input.ownershipType);
  }
  if (input.attribution !== undefined) {
    fields.push(`attribution = $${idx++}`);
    values.push(input.attribution);
  }
  if (input.evidenceIds !== undefined) {
    fields.push(`evidence_ids = $${idx++}::uuid[]`);
    values.push(input.evidenceIds);
  }
  if (input.similarityCheckId !== undefined) {
    fields.push(`similarity_check_id = $${idx++}`);
    values.push(input.similarityCheckId);
  }

  if (fields.length === 0) return current;
  fields.push(`version = version + 1, updated_at = NOW()`);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_provenance SET ${fields.join(', ')} WHERE id = $${idx} AND version = $${idx + 1}
     RETURNING id, content_id as "contentId", content_version_id as "contentVersionId",
               source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
               verification_status as "verificationStatus", publication_status as "publicationStatus",
               attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
               created_by as "createdBy", reviewed_by as "reviewedBy",
               created_at as "createdAt", updated_at as "updatedAt",
               verified_at as "verifiedAt", expires_at as "expiresAt",
               supersedes, version`,
    [...values, id, expectedVersion],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as ProvenanceRecord;
}

export async function setSimilarityCheckId(
  connection: DatabaseConnection,
  id: ProvenanceId,
  similarityCheckId: string,
): Promise<void> {
  await connection.pool.query(
    `UPDATE content_provenance SET similarity_check_id = $2, updated_at = NOW() WHERE id = $1`,
    [id, similarityCheckId],
  );
}

export async function listProvenanceRecords(connection: DatabaseConnection): Promise<ProvenanceRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, content_id as "contentId", content_version_id as "contentVersionId",
            source_id as "sourceId", licence_id as "licenceId", ownership_type as "ownershipType",
            verification_status as "verificationStatus", publication_status as "publicationStatus",
            attribution, evidence_ids as "evidenceIds", similarity_check_id as "similarityCheckId",
            created_by as "createdBy", reviewed_by as "reviewedBy",
            created_at as "createdAt", updated_at as "updatedAt",
            verified_at as "verifiedAt", expires_at as "expiresAt",
            supersedes, version
     FROM content_provenance ORDER BY created_at DESC`,
  );
  return result.rows as unknown as ProvenanceRecord[];
}
