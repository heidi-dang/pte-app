/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { createUsersRepository, createSessionsRepository } from '@pte-app/db';

interface ResetPasswordBody {
  token?: string;
  newPassword?: string;
}

export const resetPasswordRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: ResetPasswordBody }>('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body || {};

    if (!token || !newPassword) {
      reply.status(400).send({ error: 'Bad Request', message: 'Missing token or new password' });
      return;
    }

    if (newPassword.length < 8) {
      reply.status(400).send({ error: 'Bad Request', message: 'Password must be at least 8 characters long' });
      return;
    }

    try {
      const config = (fastify as any).config || { bcryptCost: 12 };

      const verification = await fastify.repositories.users.findActiveVerification(token);
      if (!verification) {
        reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired reset token' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, config.bcryptCost);

      await fastify.db.$transaction(async (tx) => {
        const txUsersRepo = createUsersRepository(tx as any);
        const txSessionsRepo = createSessionsRepository(tx as any);

        // 1. Update user password
        await tx.user.update({
          where: { id: verification.userId },
          data: { passwordHash },
        });

        // 2. Consume reset token
        await txUsersRepo.consumeVerification(verification.id);

        // 3. Invalidate all sessions of this user
        await txSessionsRepo.invalidateAllUserSessions(verification.userId);
      });

      reply.status(200).send({ message: 'Password has been reset successfully' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to reset password' });
    }
  });
};
export default resetPasswordRoute;
