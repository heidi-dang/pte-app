import type { DatabaseConnection } from '@pte-app/database';
import type { ScoringProfile, ScoringResult, QuestionVersionId } from '@pte-app/contracts';
import { scoreObjective, rescore } from '@pte-app/domain';

export class ScoringService {
  constructor(private readonly connection: DatabaseConnection) {}

  async score(input: {
    attemptId: string;
    questionVersionId: string;
    taskType: string;
    selectedAnswers: unknown;
    correctAnswers: unknown;
    scoringProfile: ScoringProfile;
  }): Promise<ScoringResult> {
    return scoreObjective(
      {
        questionVersionId: input.questionVersionId as QuestionVersionId,
        taskType: input.taskType,
        selectedAnswers: input.selectedAnswers,
        correctAnswers: input.correctAnswers,
      },
      input.scoringProfile,
      input.attemptId,
    );
  }

  async rescore(
    originalResult: ScoringResult,
    newBoundedResult: number,
    newEvidence: ScoringResult['componentEvidence'],
    reason: string,
  ): Promise<ScoringResult> {
    return rescore(originalResult, newBoundedResult, newEvidence, reason);
  }
}
