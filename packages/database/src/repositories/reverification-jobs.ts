import type { DatabaseConnection } from '../client.js';
import type { ReVerificationJob, ReVerificationJobId, ProvenanceId } from '@pte-app/contracts';

export async function createReVerificationJob(
  connection: DatabaseConnection,
  input: {
    id: ReVerificationJobId;
    provenanceId: ProvenanceId;
    reason: string;
  },
): Promise<ReVerificationJob> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_reverification_jobs (id, provenance_id, reason, attempt)
     VALUES ($1,$2,$3,1)
     RETURNING id, provenance_id as "provenanceId", reason,
               created_at as "createdAt", completed_at as "completedAt",
               status, attempt`,
    [input.id, input.provenanceId, input.reason],
  );
  if (!result.rows[0]) throw new Error('Failed to create re-verification job');
  return result.rows[0] as unknown as ReVerificationJob;
}

export async function getReVerificationJobById(
  connection: DatabaseConnection,
  id: ReVerificationJobId,
): Promise<ReVerificationJob | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, provenance_id as "provenanceId", reason,
            created_at as "createdAt", completed_at as "completedAt",
            status, attempt
     FROM content_reverification_jobs WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as ReVerificationJobId,
    provenanceId: row.provenanceId as ProvenanceId,
    reason: row.reason as string,
    createdAt: row.createdAt as string,
    completedAt: row.completedAt as string | null,
    status: row.status as ReVerificationJob['status'],
    attempt: row.attempt as number,
  };
}

export async function listPendingReVerificationJobs(connection: DatabaseConnection): Promise<ReVerificationJob[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, provenance_id as "provenanceId", reason,
            created_at as "createdAt", completed_at as "completedAt",
            status, attempt
     FROM content_reverification_jobs
     WHERE status = 'pending'
     ORDER BY created_at ASC`,
  );
  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as ReVerificationJobId,
    provenanceId: row.provenanceId as ProvenanceId,
    reason: row.reason as string,
    createdAt: row.createdAt as string,
    completedAt: row.completedAt as string | null,
    status: 'pending' as const,
    attempt: row.attempt as number,
  }));
}

export async function retryReVerificationJob(
  connection: DatabaseConnection,
  id: ReVerificationJobId,
): Promise<ReVerificationJob | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_reverification_jobs
     SET status = 'pending', attempt = attempt + 1
     WHERE id = $1 AND status = 'failed'
     RETURNING id, provenance_id as "provenanceId", reason,
               created_at as "createdAt", completed_at as "completedAt",
               status, attempt`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as ReVerificationJobId,
    provenanceId: row.provenanceId as ProvenanceId,
    reason: row.reason as string,
    createdAt: row.createdAt as string,
    completedAt: row.completedAt as string | null,
    status: 'pending',
    attempt: row.attempt as number,
  };
}

export async function completeReVerificationJob(
  connection: DatabaseConnection,
  id: ReVerificationJobId,
): Promise<ReVerificationJob | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_reverification_jobs
     SET status = 'completed', completed_at = NOW()
     WHERE id = $1
     RETURNING id, provenance_id as "provenanceId", reason,
               created_at as "createdAt", completed_at as "completedAt",
               status, attempt`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as ReVerificationJobId,
    provenanceId: row.provenanceId as ProvenanceId,
    reason: row.reason as string,
    createdAt: row.createdAt as string,
    completedAt: row.completedAt as string,
    status: 'completed',
    attempt: row.attempt as number,
  };
}

export async function failReVerificationJob(
  connection: DatabaseConnection,
  id: ReVerificationJobId,
): Promise<ReVerificationJob | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_reverification_jobs
     SET status = 'failed'
     WHERE id = $1
     RETURNING id, provenance_id as "provenanceId", reason,
               created_at as "createdAt", completed_at as "completedAt",
               status, attempt`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id as ReVerificationJobId,
    provenanceId: row.provenanceId as ProvenanceId,
    reason: row.reason as string,
    createdAt: row.createdAt as string,
    completedAt: null,
    status: 'failed',
    attempt: row.attempt as number,
  };
}
