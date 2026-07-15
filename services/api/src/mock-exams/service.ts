import type { DatabaseConnection } from '@pte-app/database';
import type { MockSession } from '@pte-app/contracts';
import { transitionMock } from '@pte-app/domain';

export class MockExamService {
  constructor(private readonly connection: DatabaseConnection) {}

  async getSession(sessionId: string): Promise<MockSession | null> {
    const result = await this.connection.pool.query(`SELECT * FROM mock_sessions WHERE id = $1`, [sessionId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      blueprintId: row.blueprint_id,
      blueprintVersion: row.blueprint_version,
      serverDeadline: row.server_deadline,
      currentSection: row.current_section,
      currentTaskPosition: row.current_task_position,
      selectedQuestions: JSON.parse(row.selected_questions || '[]'),
      responses: JSON.parse(row.responses || '[]'),
      playbackState: JSON.parse(row.playback_state || '{}'),
      recordingState: JSON.parse(row.recording_state || '{}'),
      progress: {
        completedTasks: row.progress_completed_tasks,
        totalTasks: row.progress_total_tasks,
        currentSectionTasks: row.progress_current_section_tasks,
        totalSectionTasks: row.progress_total_section_tasks,
      },
      submissionState: {
        submitted: row.submission_submitted === 1,
        idempotencyKey: row.submission_idempotency_key,
        submittedAt: row.submission_submitted_at,
      },
      scoringWorkflow: {
        state: row.scoring_workflow_state,
        jobId: row.scoring_workflow_job_id,
        startedAt: row.scoring_workflow_started_at,
        completedAt: row.scoring_workflow_completed_at,
      },
      resultId: row.result_id,
      state: row.state,
      createdAt: row.created_at,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      expiredAt: row.expired_at,
    };
  }

  async transitionState(sessionId: string, targetState: MockSession['state']): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const newState = transitionMock(session.state, targetState);
    await this.connection.pool.query(`UPDATE mock_sessions SET state = $2, updated_at = $3 WHERE id = $1`, [
      sessionId,
      newState,
      new Date().toISOString(),
    ]);
  }
}
