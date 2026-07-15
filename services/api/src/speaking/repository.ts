import type { DatabaseConnection } from '@pte-app/database';

export interface SpeakingRecordingRow {
  id: string;
  session_id: string;
  user_id: string;
  recording_profile_id: string;
  state: string;
  duration_ms: number;
  media_object_id?: string;
  upload_session_id?: string;
  uploaded_chunk_count: number;
  total_chunk_count: number;
  checksum?: string;
  finalisation_state: string;
  local_preservation_state: string;
  created_at: string;
  updated_at: string;
}

export class SpeakingRecordingRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async createRecording(row: Omit<SpeakingRecordingRow, 'created_at' | 'updated_at'>): Promise<SpeakingRecordingRow> {
    const now = new Date().toISOString();
    await this.connection.pool.query(
      `INSERT INTO speaking_recordings (id, session_id, user_id, recording_profile_id, state, duration_ms,
        media_object_id, upload_session_id, uploaded_chunk_count, total_chunk_count, checksum,
        finalisation_state, local_preservation_state, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        row.id,
        row.session_id,
        row.user_id,
        row.recording_profile_id,
        row.state,
        row.duration_ms,
        row.media_object_id ?? null,
        row.upload_session_id ?? null,
        row.uploaded_chunk_count,
        row.total_chunk_count,
        row.checksum ?? null,
        row.finalisation_state,
        row.local_preservation_state,
        now,
        now,
      ],
    );
    return { ...row, created_at: now, updated_at: now };
  }

  async updateRecordingState(id: string, state: string): Promise<void> {
    await this.connection.pool.query(`UPDATE speaking_recordings SET state = $2, updated_at = $3 WHERE id = $1`, [
      id,
      state,
      new Date().toISOString(),
    ]);
  }

  async getRecording(id: string): Promise<SpeakingRecordingRow | null> {
    const result = await this.connection.pool.query(`SELECT * FROM speaking_recordings WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  }
}
