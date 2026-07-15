import type { FastifyInstance } from 'fastify';
import type { ScoringService } from './service.js';
import type { ScoringProfileId, QuestionVersionId } from '@pte-app/contracts';

export function registerScoringRoutes(app: FastifyInstance, service: ScoringService): void {
  app.post('/scoring/score', async (request, reply) => {
    const body = request.body as {
      attemptId: string;
      questionVersionId: string;
      taskType: string;
      selectedAnswers: unknown;
      correctAnswers: unknown;
      scoringProfile: {
        id: string;
        version: number;
        correctCredit: number;
        incorrectDeduction: number;
        minimumResult: number;
        maximumResult: number;
        rounding: { method: string; decimalPlaces: number };
        normalisation: { enabled: boolean; method: string };
        noResponseBehaviour: { result: number; reason: string };
      };
    };
    const result = await service.score({
      attemptId: body.attemptId,
      questionVersionId: body.questionVersionId as QuestionVersionId,
      taskType: body.taskType,
      selectedAnswers: body.selectedAnswers,
      correctAnswers: body.correctAnswers,
      scoringProfile: {
        ...body.scoringProfile,
        id: body.scoringProfile.id as ScoringProfileId,
        rounding: body.scoringProfile.rounding as {
          method: 'none' | 'floor' | 'ceil' | 'round';
          decimalPlaces: number;
        },
        normalisation: body.scoringProfile.normalisation as { enabled: boolean; method: 'none' | 'linear' | 'z-score' },
        noResponseBehaviour: body.scoringProfile.noResponseBehaviour as {
          result: number;
          reason: 'profile-default' | 'penalty' | 'zero';
        },
      },
    });
    return reply.status(200).send(result);
  });
}
