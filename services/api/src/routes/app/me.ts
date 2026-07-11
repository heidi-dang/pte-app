/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const meRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const user = await fastify.repositories.users.findById(userId);
      if (!user) {
        reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        return;
      }

      reply.status(200).send({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: user.profile,
        roles: (user.roles as any).map((ur: any) => ur.role.name),
        createdAt: user.createdAt,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch user' });
    }
  });
};
export default meRoute;
