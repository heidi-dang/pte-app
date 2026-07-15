import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function staffRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/permissions/:userId',
    async (_req: FastifyRequest<{ Params: { userId: string } }>, _reply: FastifyReply) => {
      return { status: 'structural' };
    },
  );
}
