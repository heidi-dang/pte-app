import { PrismaClient, ScoringMethod, ScoringStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface CreateScoringResultInput {
  scoringProfileId: string;
  scoringProfileVersion: string;
  questionVersion: string;
  providerVersion?: string;
  scoringMethod: ScoringMethod;
  practiceResponseId?: string;
  attemptResponseId?: string;
  diagnosticAttemptId?: string;
  mockAttemptId?: string;
  sectionAttemptId?: string;
}

export interface CompleteScoringResultInput {
  id: string;
  estimatedScore: number;
  confidenceLow: number;
  confidenceHigh: number;
  rawResponse?: Prisma.InputJsonValue;
  components: Array<{
    criterion: string;
    score: number;
    evidence: Prisma.InputJsonValue;
  }>;
}

export function createScoringRepository(db: PrismaClient) {
  return {
    /** Create a pending scoring result record. */
    async createPendingResult(input: CreateScoringResultInput) {
      return db.scoringResult.create({
        data: {
          scoringProfileId: input.scoringProfileId,
          scoringProfileVersion: input.scoringProfileVersion,
          questionVersion: input.questionVersion,
          providerVersion: input.providerVersion,
          scoringMethod: input.scoringMethod,
          status: ScoringStatus.PENDING,
          practiceResponseId: input.practiceResponseId,
          attemptResponseId: input.attemptResponseId,
          diagnosticAttemptId: input.diagnosticAttemptId,
          mockAttemptId: input.mockAttemptId,
          sectionAttemptId: input.sectionAttemptId,
        },
      });
    },

    /** Mark a result as processing. */
    async markProcessing(id: string) {
      return db.scoringResult.update({
        where: { id },
        data: { status: ScoringStatus.PROCESSING },
      });
    },

    /**
     * Complete a scoring result with component-level evidence and confidence range.
     * Stores the exact profile version used — historical integrity is guaranteed.
     */
    async completeResult(input: CompleteScoringResultInput) {
      return db.$transaction(async (tx) => {
        const result = await tx.scoringResult.update({
          where: { id: input.id },
          data: {
            status: ScoringStatus.COMPLETED,
            estimatedScore: input.estimatedScore,
            confidenceLow: input.confidenceLow,
            confidenceHigh: input.confidenceHigh,
            rawResponse: input.rawResponse,
            scoredAt: new Date(),
          },
        });

        await tx.scoringResultComponent.createMany({
          data: input.components.map((c) => ({
            scoringResultId: input.id,
            criterion: c.criterion,
            score: c.score,
            evidence: c.evidence,
          })),
        });

        return result;
      });
    },

    /** Mark a result as failed (for retry or dead-letter queue). */
    async markFailed(id: string, _error: string) {
      return db.scoringResult.update({
        where: { id },
        data: { status: ScoringStatus.FAILED },
      });
    },

    /** Queue failed results for reprocessing. */
    async requeueFailed(id: string) {
      return db.scoringResult.update({
        where: { id },
        data: { status: ScoringStatus.QUEUED },
      });
    },

    /** Find a scoring result with its components. */
    async findById(id: string) {
      return db.scoringResult.findUnique({
        where: { id },
        include: { components: true, teacherReview: true },
      });
    },

    /** Find all scoring results for a diagnostic attempt. */
    async findForDiagnosticAttempt(diagnosticAttemptId: string) {
      return db.scoringResult.findMany({
        where: { diagnosticAttemptId },
        include: { components: true, teacherReview: true },
      });
    },

    /** Find all scoring results for a mock attempt. */
    async findForMockAttempt(mockAttemptId: string) {
      return db.scoringResult.findMany({
        where: { mockAttemptId },
        include: { components: true, teacherReview: true },
      });
    },

    /** Get the active scoring profile for a given task type. */
    async findActiveScoringProfile(taskType: string) {
      return db.scoringProfile.findFirst({
        where: { taskType, isActive: true },
      });
    },
  };
}
