/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';

interface ForgotPasswordBody {
  email?: string;
}

export const forgotPasswordRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: ForgotPasswordBody }>('/forgot-password', async (request, reply) => {
    const { email } = request.body || {};

    if (!email) {
      reply.status(400).send({ error: 'Bad Request', message: 'Missing email address' });
      return;
    }

    try {
      const config = (fastify as any).config || { passwordResetExpirySecs: 3600, appUrl: 'http://localhost:3000' };
      const user = await fastify.repositories.users.findByEmail(email);

      // Security: Silently return 200 even if user doesn't exist to prevent email enumeration
      if (!user) {
        reply.status(200).send({});
        return;
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + config.passwordResetExpirySecs * 1000);

      await fastify.repositories.users.createEmailVerification({
        userId: user.id,
        token,
        expiresAt,
      });

      // Dispatch reset email
      const resetUrl = `${config.appUrl}/reset-password?token=${token}`;
      await fastify.emailProvider.send({
        to: user.email,
        subject: 'Reset your password',
        text: `Please reset your password by clicking this link: ${resetUrl}`,
        html: `<p>Please reset your password by clicking <a href="${resetUrl}">here</a>.</p>`,
      });

      reply.status(200).send({});
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to request password reset' });
    }
  });
};
export default forgotPasswordRoute;
