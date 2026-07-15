import type { FastifyInstance } from 'fastify';
import type { ScoringService } from './service.js';
import type { ScoringProfile } from '@pte-app/contracts';

export function registerScoringRoutes(app: FastifyInstance, service: ScoringService): void {
  app.post('/scoring/score', async (request, reply) => {
    const body = request.body as {
      attemptId: string;
      questionVersionId: string;
      taskType: string;
      selectedAnswers: unknown;
      correctAnswers: unknown;
      scoringProfile: ScoringProfile;
    };
    const result = await service.score(body);
    return reply.status(200).send(result);
  });
}
