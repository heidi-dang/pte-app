import type { DatabaseConnection } from '../client.js';
import type { EvidenceRecord, EvidenceId, UserId, EvidenceType, MediaId } from '@pte-app/contracts';

export async function createEvidence(
  connection: DatabaseConnection,
  input: {
    id: EvidenceId;
    evidenceType: EvidenceType;
    fileName: string;
    mediaId: MediaId;
    checksum: string;
    mimeType: string;
    description: string;
    uploadedBy: UserId;
    retainedUntil: string;
  },
): Promise<EvidenceRecord> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_evidence (id, evidence_type, file_name, media_id, checksum, mime_type, description, uploaded_by, retained_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
               checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
               uploaded_at as "uploadedAt", retained_until as "retainedUntil", status`,
    [
      input.id,
      input.evidenceType,
      input.fileName,
      input.mediaId,
      input.checksum,
      input.mimeType,
      input.description,
      input.uploadedBy,
      input.retainedUntil,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create evidence');
  return result.rows[0] as unknown as EvidenceRecord;
}

export async function getEvidenceById(
  connection: DatabaseConnection,
  id: EvidenceId,
): Promise<EvidenceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
            checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
            uploaded_at as "uploadedAt", retained_until as "retainedUntil", status
     FROM content_evidence WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as EvidenceRecord;
}

export async function invalidateEvidence(
  connection: DatabaseConnection,
  id: EvidenceId,
): Promise<EvidenceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_evidence SET status = 'invalid'
     WHERE id = $1 AND status = 'active'
     RETURNING id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
               checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
               uploaded_at as "uploadedAt", retained_until as "retainedUntil", status`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as EvidenceRecord;
}

export async function listEvidenceForContent(
  connection: DatabaseConnection,
  evidenceIds: EvidenceId[],
): Promise<EvidenceRecord[]> {
  if (evidenceIds.length === 0) return [];
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
            checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
            uploaded_at as "uploadedAt", retained_until as "retainedUntil", status
     FROM content_evidence WHERE id = ANY($1)`,
    [evidenceIds],
  );
  return result.rows as unknown as EvidenceRecord[];
}
