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
  const result = await connection.pool.query<ProvenanceRecord>(
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
  return result.rows[0];
}

export async function getProvenanceById(
  connection: DatabaseConnection,
  id: ProvenanceId,
): Promise<ProvenanceRecord | undefined> {
  const result = await connection.pool.query<ProvenanceRecord>(
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
  return result.rows[0];
}

export async function updateProvenanceStatus(
  connection: DatabaseConnection,
  id: ProvenanceId,
  status: VerificationStatus,
  reviewedBy?: UserId,
): Promise<ProvenanceRecord | undefined> {
  const setClauses = ['verification_status = $2', 'updated_at = NOW()'];
  const values: unknown[] = [id, status];
  if (reviewedBy) {
    setClauses.push(`reviewed_by = $3`);
    values.push(reviewedBy);
  }
  if (status === 'verified') {
    setClauses.push(`verified_at = NOW()`);
  }
  const result = await connection.pool.query<ProvenanceRecord>(
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
  return result.rows[0];
}

export async function listProvenanceRecords(connection: DatabaseConnection): Promise<ProvenanceRecord[]> {
  const result = await connection.pool.query<ProvenanceRecord>(
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
  return result.rows;
}
