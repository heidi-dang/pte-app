/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createUsersRepository, createAuditRepository, AuditAction } from '@pte-app/db';

interface VerifyEmailQuery {
  token?: string;
}

export const verifyEmailRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: VerifyEmailQuery }>('/verify-email', async (request, reply) => {
    const { token } = request.query || {};

    if (!token) {
      reply.status(400).send({ error: 'Bad Request', message: 'Missing verification token' });
      return;
    }

    try {
      const verification = await fastify.repositories.users.findActiveVerification(token);
      if (!verification) {
        reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired verification token' });
        return;
      }

      await fastify.db.$transaction(async (tx) => {
        const txUsersRepo = createUsersRepository(tx as any);
        const txAuditRepo = createAuditRepository(tx as any);

        // Mark user verified
        await txUsersRepo.markEmailVerified(verification.userId);

        // Consume verification token
        await txUsersRepo.consumeVerification(verification.id);

        // Append Audit Log
        await txAuditRepo.append({
          userId: verification.userId,
          action: AuditAction.USER_VERIFIED,
          entityType: 'User',
          entityId: verification.userId,
          ipAddress: request.ip,
        });
      });

      reply.status(200).send({ message: 'Email address verified successfully' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to verify email' });
    }
  });
};
export default verifyEmailRoute;
