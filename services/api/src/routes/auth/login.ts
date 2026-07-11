/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { AuditAction } from '@pte-app/db';

interface LoginBody {
  email?: string;
  password?: string;
}

export const loginRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      reply.status(400).send({ error: 'Bad Request', message: 'Missing email or password' });
      return;
    }

    try {
      const config = (fastify as any).config || {
        bcryptCost: 12,
        maxFailedAttempts: 5,
        lockoutSeconds: 60,
        sessionIdleTimeoutSeconds: 86400,
      };

      const user = await fastify.repositories.users.findByEmail(email);

      // Guard 1: User does not exist
      if (!user) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }

      // Guard 2: Lockout check
      const isLocked = await fastify.repositories.users.isLockedOut(user.id);
      if (isLocked) {
        reply.status(423).send({
          error: 'Locked',
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        });
        return;
      }

      // Verify Password
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        // Record failed attempt
        await fastify.repositories.users.recordFailedLogin(user.id, config.maxFailedAttempts, config.lockoutSeconds);

        const checkLockAgain = await fastify.repositories.users.isLockedOut(user.id);
        if (checkLockAgain) {
          // Log Lockout
          await fastify.repositories.audit.append({
            userId: user.id,
            action: AuditAction.USER_LOCKED,
            entityType: 'User',
            entityId: user.id,
            ipAddress: request.ip,
          });
          reply.status(423).send({
            error: 'Locked',
            message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
          });
          return;
        }

        reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }

      // Success: Reset failed attempts & generate session token
      await fastify.repositories.users.resetFailedLogins(user.id);

      const token = crypto.randomBytes(48).toString('hex');
      const expiresAt = new Date(Date.now() + config.sessionIdleTimeoutSeconds * 1000);

      await fastify.repositories.sessions.createSession({
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      // Audit log
      await fastify.repositories.audit.append({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entityType: 'User',
        entityId: user.id,
        ipAddress: request.ip,
      });

      reply.status(200).send({ token, expiresAt });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to process login' });
    }
  });
};
export default loginRoute;
