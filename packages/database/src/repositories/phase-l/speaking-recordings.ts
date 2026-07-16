import type { DatabaseConnection } from '../../client.js';
import { randomUUID } from 'node:crypto';

export interface SpeakingRecordingRow {
  id: string;
  attempt_id: string;
  user_id: string;
  recording_profile_id: string;
  state: string;
  duration_ms: number;
  media_object_id: string | null;
  upload_session_id: string | null;
  uploaded_chunk_count: number;
  total_chunk_count: number;
  checksum: string | null;
  finalisation_state: string;
  local_preservation_state: string;
  created_at: string;
  updated_at: string;
}

export interface UploadSessionRow {
  id: string;
  recording_id: string;
  total_chunks: number;
  acknowledged_chunks: number;
  acknowledged_sequence_numbers: number[];
  state: string;
  created_at: string;
  updated_at: string;
}

export interface UploadChunkRow {
  id: string;
  upload_session_id: string;
  sequence_number: number;
  byte_count: number;
  chunk_storage_key: string;
  checksum: string | null;
  acknowledged_at: string;
  created_at: string;
}

export function mapRecording(row: Record<string, unknown>): SpeakingRecordingRow {
  return {
    id: row.id as string,
    attempt_id: row.attempt_id as string,
    user_id: row.user_id as string,
    recording_profile_id: row.recording_profile_id as string,
    state: row.state as string,
    duration_ms: Number(row.duration_ms),
    media_object_id: (row.media_object_id as string) ?? null,
    upload_session_id: (row.upload_session_id as string) ?? null,
    uploaded_chunk_count: Number(row.uploaded_chunk_count),
    total_chunk_count: Number(row.total_chunk_count),
    checksum: (row.checksum as string) ?? null,
    finalisation_state: row.finalisation_state as string,
    local_preservation_state: row.local_preservation_state as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapUploadSession(row: Record<string, unknown>): UploadSessionRow {
  return {
    id: row.id as string,
    recording_id: row.recording_id as string,
    total_chunks: Number(row.total_chunks),
    acknowledged_chunks: Number(row.acknowledged_chunks),
    acknowledged_sequence_numbers: (row.acknowledged_sequence_numbers as number[]) ?? [],
    state: row.state as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function createRecording(
  connection: DatabaseConnection,
  attemptId: string,
  userId: string,
  recordingProfileId: string,
): Promise<SpeakingRecordingRow> {
  const id = randomUUID();
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO speaking_recordings (
      id, attempt_id, user_id, recording_profile_id, state, duration_ms,
      uploaded_chunk_count, total_chunk_count, finalisation_state,
      local_preservation_state, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, 'not-started', 0, 0, 0, 'pending', 'none', NOW(), NOW()
    )
    RETURNING *`,
    [id, attemptId, userId, recordingProfileId],
  );
  if (!result.rows[0]) throw new Error('Failed to create recording');
  return mapRecording(result.rows[0]);
}

export async function getRecording(
  connection: DatabaseConnection,
  recordingId: string,
): Promise<SpeakingRecordingRow | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM speaking_recordings WHERE id = $1`,
    [recordingId],
  );
  return result.rows[0] ? mapRecording(result.rows[0]) : undefined;
}

export async function getRecordingByAttempt(
  connection: DatabaseConnection,
  attemptId: string,
): Promise<SpeakingRecordingRow | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM speaking_recordings WHERE attempt_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [attemptId],
  );
  return result.rows[0] ? mapRecording(result.rows[0]) : undefined;
}

export async function updateRecordingState(
  connection: DatabaseConnection,
  recordingId: string,
  state: string,
): Promise<SpeakingRecordingRow> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE speaking_recordings SET state = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [recordingId, state],
  );
  if (!result.rows[0]) throw new Error(`Recording ${recordingId} not found`);
  return mapRecording(result.rows[0]);
}

export async function updateRecordingDuration(
  connection: DatabaseConnection,
  recordingId: string,
  durationMs: number,
): Promise<void> {
  await connection.pool.query(`UPDATE speaking_recordings SET duration_ms = $2, updated_at = NOW() WHERE id = $1`, [
    recordingId,
    durationMs,
  ]);
}

export async function createUploadSession(
  connection: DatabaseConnection,
  recordingId: string,
  totalChunks: number,
): Promise<UploadSessionRow> {
  const id = randomUUID();

  await connection.pool.query(
    `INSERT INTO recording_upload_sessions (
      id, recording_id, total_chunks, acknowledged_chunks,
      acknowledged_sequence_numbers, state, created_at, updated_at
    ) VALUES (
      $1, $2, $3, 0, '{}', 'active', NOW(), NOW()
    )
    ON CONFLICT (recording_id) DO NOTHING`,
    [id, recordingId, totalChunks],
  );

  await connection.pool.query(
    `UPDATE speaking_recordings SET upload_session_id = $2, updated_at = NOW() WHERE id = $1`,
    [recordingId, id],
  );

  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_sessions WHERE recording_id = $1`,
    [recordingId],
  );
  if (!result.rows[0]) throw new Error('Failed to create upload session');
  return mapUploadSession(result.rows[0]);
}

export async function getUploadSession(
  connection: DatabaseConnection,
  sessionId: string,
): Promise<UploadSessionRow | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_sessions WHERE id = $1`,
    [sessionId],
  );
  return result.rows[0] ? mapUploadSession(result.rows[0]) : undefined;
}

export async function getUploadSessionByRecording(
  connection: DatabaseConnection,
  recordingId: string,
): Promise<UploadSessionRow | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_sessions WHERE recording_id = $1`,
    [recordingId],
  );
  return result.rows[0] ? mapUploadSession(result.rows[0]) : undefined;
}

export async function acknowledgeChunk(
  connection: DatabaseConnection,
  sessionId: string,
  sequenceNumber: number,
  byteCount: number,
  chunkStorageKey: string,
  checksum?: string,
): Promise<{ chunk: UploadChunkRow; conflict: boolean }> {
  const existing = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_chunks
     WHERE upload_session_id = $1 AND sequence_number = $2`,
    [sessionId, sequenceNumber],
  );

  if (existing.rows[0]) {
    const existingChunk = existing.rows[0];
    if (existingChunk.chunk_storage_key === chunkStorageKey) {
      return {
        chunk: {
          id: existingChunk.id as string,
          upload_session_id: existingChunk.upload_session_id as string,
          sequence_number: Number(existingChunk.sequence_number),
          byte_count: Number(existingChunk.byte_count),
          chunk_storage_key: existingChunk.chunk_storage_key as string,
          checksum: (existingChunk.checksum as string) ?? null,
          acknowledged_at: existingChunk.acknowledged_at as string,
          created_at: existingChunk.created_at as string,
        },
        conflict: false,
      };
    }
    return {
      chunk: {
        id: existingChunk.id as string,
        upload_session_id: existingChunk.upload_session_id as string,
        sequence_number: Number(existingChunk.sequence_number),
        byte_count: Number(existingChunk.byte_count),
        chunk_storage_key: existingChunk.chunk_storage_key as string,
        checksum: (existingChunk.checksum as string) ?? null,
        acknowledged_at: existingChunk.acknowledged_at as string,
        created_at: existingChunk.created_at as string,
      },
      conflict: true,
    };
  }

  const id = randomUUID();
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO recording_upload_chunks (
      id, upload_session_id, sequence_number, byte_count,
      chunk_storage_key, checksum, acknowledged_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING *`,
    [id, sessionId, sequenceNumber, byteCount, chunkStorageKey, checksum ?? null],
  );

  const ackResult = await connection.pool.query<{ acknowledged_sequence_numbers: number[] }>(
    `SELECT acknowledged_sequence_numbers FROM recording_upload_sessions WHERE id = $1`,
    [sessionId],
  );
  const acknowledgedNums = ackResult.rows[0]?.acknowledged_sequence_numbers ?? [];

  const newNums = [...new Set([...acknowledgedNums, sequenceNumber])].sort((a, b) => a - b);
  await connection.pool.query(
    `UPDATE recording_upload_sessions
     SET acknowledged_chunks = $2, acknowledged_sequence_numbers = $3, updated_at = NOW()
     WHERE id = $1`,
    [sessionId, newNums.length, newNums],
  );

  await connection.pool.query(
    `UPDATE speaking_recordings
     SET uploaded_chunk_count = $2, updated_at = NOW()
     WHERE upload_session_id = $1`,
    [sessionId, newNums.length],
  );

  if (!result.rows[0]) throw new Error('Failed to acknowledge chunk');

  return {
    chunk: {
      id: result.rows[0].id as string,
      upload_session_id: result.rows[0].upload_session_id as string,
      sequence_number: Number(result.rows[0].sequence_number),
      byte_count: Number(result.rows[0].byte_count),
      chunk_storage_key: result.rows[0].chunk_storage_key as string,
      checksum: (result.rows[0].checksum as string) ?? null,
      acknowledged_at: result.rows[0].acknowledged_at as string,
      created_at: result.rows[0].created_at as string,
    },
    conflict: false,
  };
}

export async function getChunksForSession(
  connection: DatabaseConnection,
  sessionId: string,
): Promise<UploadChunkRow[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_chunks
     WHERE upload_session_id = $1
     ORDER BY sequence_number`,
    [sessionId],
  );
  return result.rows.map((r): UploadChunkRow => ({
    id: r.id as string,
    upload_session_id: r.upload_session_id as string,
    sequence_number: Number(r.sequence_number),
    byte_count: Number(r.byte_count),
    chunk_storage_key: r.chunk_storage_key as string,
    checksum: (r.checksum as string) ?? null,
    acknowledged_at: r.acknowledged_at as string,
    created_at: r.created_at as string,
  }));
}

export async function completeUploadSession(
  connection: DatabaseConnection,
  sessionId: string,
): Promise<UploadSessionRow> {
  await connection.pool.query(
    `UPDATE recording_upload_sessions SET state = 'completed', updated_at = NOW() WHERE id = $1`,
    [sessionId],
  );
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_sessions WHERE id = $1`,
    [sessionId],
  );
  if (!result.rows[0]) throw new Error(`Upload session ${sessionId} not found`);
  return mapUploadSession(result.rows[0]);
}

export async function updateUploadSessionState(
  connection: DatabaseConnection,
  sessionId: string,
  state: string,
): Promise<UploadSessionRow> {
  await connection.pool.query(`UPDATE recording_upload_sessions SET state = $2, updated_at = NOW() WHERE id = $1`, [
    sessionId,
    state,
  ]);
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT * FROM recording_upload_sessions WHERE id = $1`,
    [sessionId],
  );
  if (!result.rows[0]) throw new Error(`Upload session ${sessionId} not found`);
  return mapUploadSession(result.rows[0]);
}

export async function finaliseRecording(
  connection: DatabaseConnection,
  recordingId: string,
): Promise<SpeakingRecordingRow> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE speaking_recordings
     SET state = 'available', finalisation_state = 'finalised', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [recordingId],
  );
  if (!result.rows[0]) throw new Error(`Recording ${recordingId} not found`);
  return mapRecording(result.rows[0]);
}

export async function createAttemptRight(
  connection: DatabaseConnection,
  recordingId: string,
  attemptNumber: number,
): Promise<void> {
  const id = randomUUID();
  await connection.pool.query(
    `INSERT INTO recording_attempt_rights (id, recording_id, attempt_number, permitted_at, created_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (recording_id, attempt_number) DO NOTHING`,
    [id, recordingId, attemptNumber],
  );
}

export async function consumeAttemptRight(
  connection: DatabaseConnection,
  recordingId: string,
  attemptNumber: number,
  result: string,
): Promise<void> {
  await connection.pool.query(
    `UPDATE recording_attempt_rights
     SET consumed_at = NOW(), result = $3
     WHERE recording_id = $1 AND attempt_number = $2`,
    [recordingId, attemptNumber, result],
  );
}

export async function getAttemptRights(
  connection: DatabaseConnection,
  recordingId: string,
): Promise<{ attempt_number: number; consumed_at: string | null; result: string | null }[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT attempt_number, consumed_at, result
     FROM recording_attempt_rights
     WHERE recording_id = $1
     ORDER BY attempt_number`,
    [recordingId],
  );
  return result.rows.map((r) => ({
    attempt_number: Number(r.attempt_number),
    consumed_at: (r.consumed_at as string) ?? null,
    result: (r.result as string) ?? null,
  }));
}
