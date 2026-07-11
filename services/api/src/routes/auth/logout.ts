import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditAction } from '@pte-app/db';

export const logoutRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization ?? '';
      const token = authHeader.substring(7).trim();
      const userId = request.user?.id;

      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      await fastify.repositories.sessions.invalidateSession(token);

      // Audit Log
      await fastify.repositories.audit.append({
        userId,
        action: AuditAction.USER_LOGOUT,
        entityType: 'User',
        entityId: userId,
        ipAddress: request.ip,
      });

      reply.status(200).send({});
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to process logout' });
    }
  });
};
export default logoutRoute;
