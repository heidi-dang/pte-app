import type { ExamContract, ExamSection } from '@pte-app/contracts';
import type { ExamId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Exam {
  readonly id: ExamId;
  readonly version: Version;
  readonly title: string;
  readonly description: string;
  readonly taskIds: ReadonlyArray<string>;
  readonly timeLimitMinutes: number;
  readonly sections: ReadonlyArray<ExamSection>;
  readonly scoringProfile: string;
  readonly passingScore: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createExam(contract: ExamContract): Exam {
  return {
    id: contract.id,
    version: contract.version,
    title: contract.title,
    description: contract.description,
    taskIds: contract.taskIds,
    timeLimitMinutes: contract.timeLimitMinutes,
    sections: contract.sections,
    scoringProfile: contract.scoringProfile,
    passingScore: contract.passingScore,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function examTaskCount(exam: Exam): number {
  return exam.taskIds.length;
}

export function examSectionCount(exam: Exam): number {
  return exam.sections.length;
}
