import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function reportingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard/:userId', async (req: FastifyRequest<{ Params: { userId: string } }>, _reply: FastifyReply) => {
    return { status: 'structural' };
  });
}
