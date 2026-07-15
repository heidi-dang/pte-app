import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function contentFactoryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/drafts', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return { status: 'structural' };
  });
}
