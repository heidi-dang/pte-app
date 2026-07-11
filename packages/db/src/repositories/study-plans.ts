import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface GenerateStudyPlanInput {
  userId: string;
  basedOnDiagId?: string;
  targetScore?: number;
  examDate?: Date;
  items: Array<{
    taskType?: string;
    activityType: string;
    dueDate: Date;
    estimatedMins: number;
    priority: number;
  }>;
}

export function createStudyPlansRepository(db: PrismaClient) {
  return {
    /**
     * Generate a new study plan, deactivating any existing active plan.
     * Returns the new plan with all items.
     */
    async generatePlan(input: GenerateStudyPlanInput) {
      return db.$transaction(async (tx) => {
        // Deactivate existing active plans
        await tx.studyPlan.updateMany({
          where: { userId: input.userId, isActive: true },
          data: { isActive: false },
        });

        return tx.studyPlan.create({
          data: {
            userId: input.userId,
            basedOnDiagId: input.basedOnDiagId,
            targetScore: input.targetScore,
            examDate: input.examDate,
            isActive: true,
            items: { create: input.items },
          },
          include: { items: true },
        });
      });
    },

    /** Get the current active study plan for a user. */
    async findActivePlan(userId: string) {
      return db.studyPlan.findFirst({
        where: { userId, isActive: true },
        include: { items: { orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }] } },
      });
    },

    /** Mark a study plan item as complete. */
    async completeItem(studyPlanItemId: string) {
      return db.$transaction(async (tx) => {
        await tx.studyPlanProgress.create({
          data: { studyPlanItemId },
        });
        return tx.studyPlanItem.update({
          where: { id: studyPlanItemId },
          data: { completedAt: new Date() },
        });
      });
    },

    /** Get overall plan completion percentage (0–100). */
    async getPlanProgress(studyPlanId: string): Promise<number> {
      const [total, completed] = await Promise.all([
        db.studyPlanItem.count({ where: { studyPlanId } }),
        db.studyPlanItem.count({
          where: { studyPlanId, completedAt: { not: null } },
        }),
      ]);
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    },

    /** Update exam date and target score — triggers plan adjustment at application layer. */
    async updatePlanTargets(
      studyPlanId: string,
      updates: Pick<Prisma.StudyPlanUpdateInput, 'targetScore' | 'examDate'>,
    ) {
      return db.studyPlan.update({ where: { id: studyPlanId }, data: updates });
    },
  };
}
