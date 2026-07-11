import { PrismaClient, AttemptStatus, AttemptType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface SubmitResponseInput {
  questionVersionId: string;
  responseData: Prisma.InputJsonValue;
  audioKey?: string;
  durationMs?: number;
}

export function createAttemptsRepository(db: PrismaClient) {
  return {
    // ─── Diagnostic ──────────────────────────────────────────────────────────

    async createDiagnosticAttempt(userId: string) {
      return db.diagnosticAttempt.create({ data: { userId } });
    },

    async findDiagnosticAttempt(id: string) {
      return db.diagnosticAttempt.findUnique({
        where: { id },
        include: { responses: true, results: { include: { components: true } } },
      });
    },

    async findUserDiagnosticAttempts(userId: string) {
      return db.diagnosticAttempt.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
      });
    },

    async completeDiagnosticAttempt(id: string) {
      return db.diagnosticAttempt.update({
        where: { id },
        data: { status: AttemptStatus.COMPLETED, completedAt: new Date() },
      });
    },

    // ─── Mock ─────────────────────────────────────────────────────────────────

    /** Create a mock attempt. serverDeadline is authoritative — set server-side only. */
    async createMockAttempt(userId: string, serverDeadline: Date) {
      return db.mockAttempt.create({ data: { userId, serverDeadline } });
    },

    async findMockAttempt(id: string) {
      return db.mockAttempt.findUnique({
        where: { id },
        include: { responses: true },
      });
    },

    async completeMockAttempt(id: string) {
      return db.mockAttempt.update({
        where: { id },
        data: { status: AttemptStatus.COMPLETED, completedAt: new Date() },
      });
    },

    async expireMockAttempt(id: string) {
      return db.mockAttempt.update({
        where: { id },
        data: { status: AttemptStatus.EXPIRED },
      });
    },

    // ─── Section ──────────────────────────────────────────────────────────────

    async createSectionAttempt(userId: string, section: string, serverDeadline: Date) {
      return db.sectionAttempt.create({ data: { userId, section, serverDeadline } });
    },

    async findSectionAttempt(id: string) {
      return db.sectionAttempt.findUnique({
        where: { id },
        include: { responses: true },
      });
    },

    async completeSectionAttempt(id: string) {
      return db.sectionAttempt.update({
        where: { id },
        data: { status: AttemptStatus.COMPLETED, completedAt: new Date() },
      });
    },

    // ─── Responses ────────────────────────────────────────────────────────────

    /**
     * Submit a response for a diagnostic attempt.
     * Idempotent: unique constraint on (diagnosticAttemptId, questionVersionId).
     */
    async submitDiagnosticResponse(diagnosticAttemptId: string, input: SubmitResponseInput) {
      return db.attemptResponse.upsert({
        where: {
          diagnosticAttemptId_questionVersionId: {
            diagnosticAttemptId,
            questionVersionId: input.questionVersionId,
          },
        },
        create: {
          attemptType: AttemptType.DIAGNOSTIC,
          diagnosticAttemptId,
          questionVersionId: input.questionVersionId,
          responseData: input.responseData,
          audioKey: input.audioKey,
          durationMs: input.durationMs,
          submittedAt: new Date(),
        },
        update: {
          // Once submitted, the response is immutable.
          // This upsert returns the existing record without modifying it.
        },
      });
    },

    /**
     * Submit a response for a mock attempt.
     * Idempotent: unique constraint on (mockAttemptId, questionVersionId).
     */
    async submitMockResponse(mockAttemptId: string, input: SubmitResponseInput) {
      return db.attemptResponse.upsert({
        where: {
          mockAttemptId_questionVersionId: {
            mockAttemptId,
            questionVersionId: input.questionVersionId,
          },
        },
        create: {
          attemptType: AttemptType.MOCK,
          mockAttemptId,
          questionVersionId: input.questionVersionId,
          responseData: input.responseData,
          audioKey: input.audioKey,
          durationMs: input.durationMs,
          submittedAt: new Date(),
        },
        update: {},
      });
    },

    /**
     * Submit a response for a section attempt.
     * Idempotent: unique constraint on (sectionAttemptId, questionVersionId).
     */
    async submitSectionResponse(sectionAttemptId: string, input: SubmitResponseInput) {
      return db.attemptResponse.upsert({
        where: {
          sectionAttemptId_questionVersionId: {
            sectionAttemptId,
            questionVersionId: input.questionVersionId,
          },
        },
        create: {
          attemptType: AttemptType.SECTION,
          sectionAttemptId,
          questionVersionId: input.questionVersionId,
          responseData: input.responseData,
          audioKey: input.audioKey,
          durationMs: input.durationMs,
          submittedAt: new Date(),
        },
        update: {},
      });
    },

    /** Increment audio playback count (for playback-limit enforcement). */
    async incrementAudioPlayback(attemptResponseId: string) {
      return db.attemptResponse.update({
        where: { id: attemptResponseId },
        data: { audioPlaybackCount: { increment: 1 } },
      });
    },
  };
}
