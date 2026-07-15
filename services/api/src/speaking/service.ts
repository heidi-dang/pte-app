import type { DatabaseConnection } from '@pte-app/database';
import { SpeakingRecordingRepository } from './repository.js';
import { randomUUID } from 'node:crypto';
import { transitionRecording, isTerminalRecordingState } from '@pte-app/domain';

export class SpeakingService {
  private readonly repo: SpeakingRecordingRepository;

  constructor(private readonly connection: DatabaseConnection) {
    this.repo = new SpeakingRecordingRepository(connection);
  }

  async startRecording(
    sessionId: string,
    userId: string,
    recordingProfileId: string,
  ): Promise<{ recordingId: string }> {
    const recordingId = randomUUID();
    await this.repo.createRecording({
      id: recordingId,
      session_id: sessionId,
      user_id: userId,
      recording_profile_id: recordingProfileId,
      state: 'not-started',
      duration_ms: 0,
      uploaded_chunk_count: 0,
      total_chunk_count: 0,
      finalisation_state: 'pending',
      local_preservation_state: 'none',
    });
    return { recordingId };
  }

  async transitionRecordingState(recordingId: string, targetState: string): Promise<void> {
    const recording = await this.repo.getRecording(recordingId);
    if (!recording) throw new Error('Recording not found');
    if (isTerminalRecordingState(recording.state as never)) {
      throw new Error(`Recording is in terminal state: ${recording.state}`);
    }
    const newState = transitionRecording(recording.state as never, targetState as never);
    await this.repo.updateRecordingState(recordingId, newState);
  }
}
