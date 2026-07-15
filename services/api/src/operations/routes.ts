import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function operationsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/notifications/:userId',
    async (_req: FastifyRequest<{ Params: { userId: string } }>, _reply: FastifyReply) => {
      return { status: 'structural' };
    },
  );
}
