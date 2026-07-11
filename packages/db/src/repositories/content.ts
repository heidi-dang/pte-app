import { PrismaClient, QuestionStatus, ReviewOutcome } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface CreateQuestionVersionInput {
  questionId?: string; // omit to create a new Question
  taskType: string;
  promptText?: string;
  promptAudioKey?: string;
  promptImageKey?: string;
  answerData: Prisma.InputJsonValue;
  metadata: Prisma.InputJsonValue;
  sourceId?: string;
  authorId: string;
}

export interface SubmitReviewInput {
  questionVersionId: string;
  reviewerId: string;
  outcome: ReviewOutcome;
  score?: number;
  feedback?: string;
}

export function createContentRepository(db: PrismaClient) {
  return {
    /** Create a new question (and its first version draft) atomically. */
    async createQuestionDraft(input: CreateQuestionVersionInput) {
      return db.$transaction(async (tx) => {
        let questionId = input.questionId;
        if (!questionId) {
          const q = await tx.question.create({
            data: { taskType: input.taskType },
          });
          questionId = q.id;
        }

        // Next version number
        const latest = await tx.questionVersion.findFirst({
          where: { questionId },
          orderBy: { version: 'desc' },
        });
        const version = (latest?.version ?? 0) + 1;

        return tx.questionVersion.create({
          data: {
            questionId,
            version,
            taskType: input.taskType,
            status: QuestionStatus.DRAFT,
            promptText: input.promptText,
            promptAudioKey: input.promptAudioKey,
            promptImageKey: input.promptImageKey,
            answerData: input.answerData,
            metadata: input.metadata,
            sourceId: input.sourceId,
            authorId: input.authorId,
          },
        });
      });
    },

    /** Transition a draft to SUBMITTED_FOR_REVIEW. Author cannot also be reviewer. */
    async submitForReview(questionVersionId: string) {
      return db.questionVersion.update({
        where: { id: questionVersionId, status: QuestionStatus.DRAFT },
        data: { status: QuestionStatus.SUBMITTED_FOR_REVIEW },
      });
    },

    /** Submit a review. Outcome determines next status. */
    async submitReview(input: SubmitReviewInput) {
      return db.$transaction(async (tx) => {
        const review = await tx.questionReview.create({
          data: {
            questionVersionId: input.questionVersionId,
            reviewerId: input.reviewerId,
            outcome: input.outcome,
            score: input.score,
            feedback: input.feedback,
          },
        });

        const nextStatus: QuestionStatus =
          input.outcome === ReviewOutcome.APPROVED
            ? QuestionStatus.APPROVED
            : input.outcome === ReviewOutcome.REJECTED
              ? QuestionStatus.DRAFT
              : QuestionStatus.REVISION_REQUESTED;

        await tx.questionVersion.update({
          where: { id: input.questionVersionId },
          data: {
            status: nextStatus,
            reviewScore: input.score,
          },
        });

        return review;
      });
    },

    /** Publish an approved question version. Only Administrator may call this. */
    async publishQuestionVersion(questionVersionId: string, _publishedBy: string) {
      return db.questionVersion.update({
        where: { id: questionVersionId, status: QuestionStatus.APPROVED },
        data: {
          status: QuestionStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    },

    /** Retire a published question version. Only Administrator may call this. */
    async retireQuestionVersion(questionVersionId: string) {
      return db.questionVersion.update({
        where: { id: questionVersionId, status: QuestionStatus.PUBLISHED },
        data: { status: QuestionStatus.RETIRED, retiredAt: new Date() },
      });
    },

    /** Find published questions by task type (for practice / exam delivery). */
    async findPublishedByTaskType(taskType: string, take = 20, skip = 0) {
      return db.questionVersion.findMany({
        where: { taskType, status: QuestionStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      });
    },

    /** Find a single published question version by ID. */
    async findPublishedById(id: string) {
      return db.questionVersion.findFirst({
        where: { id, status: QuestionStatus.PUBLISHED },
      });
    },

    /** Count published questions by task type. */
    async countPublishedByTaskType(taskType: string): Promise<number> {
      return db.questionVersion.count({
        where: { taskType, status: QuestionStatus.PUBLISHED },
      });
    },
  };
}
