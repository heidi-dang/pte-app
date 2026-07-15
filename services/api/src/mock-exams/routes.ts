import type { FastifyInstance } from 'fastify';
import type { MockExamService } from './service.js';

export function registerMockExamRoutes(app: FastifyInstance, service: MockExamService): void {
  app.get('/mock-exams/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = await service.getSession(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return reply.status(200).send(session);
  });

  app.patch('/mock-exams/:id/state', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { state } = request.body as { state: string };
    await service.transitionState(id, state as never);
    return reply.status(200).send({ ok: true });
  });
}
