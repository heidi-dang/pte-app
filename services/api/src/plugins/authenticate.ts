/* eslint-disable @typescript-eslint/no-explicit-any */
import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RoleName } from '@pte-app/db';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      emailVerified: boolean;
      roles: Array<{ role: { name: RoleName } }>;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRoles: (roles: RoleName[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  // Authentication preHandler hook
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid token format' });
      return;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Token is empty' });
      return;
    }

    try {
      const session = await fastify.repositories.sessions.findActiveSession(token);
      if (!session) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Session is invalid or expired' });
        return;
      }

      // Populate user on request
      request.user = {
        id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        roles: session.user.roles as any,
      };

      // Slide the session expiry window (idle timeout)
      const config = (fastify as any).config || { sessionIdleTimeoutSeconds: 86400 };
      const newExpiresAt = new Date(Date.now() + config.sessionIdleTimeoutSeconds * 1000);
      await fastify.db.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to authenticate session' });
    }
  });

  // Role authorization hook generator
  fastify.decorate('requireRoles', (allowedRoles: RoleName[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Must run AFTER authenticate
      if (!request.user) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const userRoles = request.user.roles.map((ur) => ur.role.name);

      // Super Administrator has bypass access to everything
      if (userRoles.includes(RoleName.SUPER_ADMINISTRATOR)) {
        return;
      }

      const hasRole = allowedRoles.some((r) => userRoles.includes(r));
      if (!hasRole) {
        reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
      }
    };
  });
});
