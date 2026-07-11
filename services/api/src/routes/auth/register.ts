/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { createUsersRepository, createAuditRepository, AuditAction, RoleName } from '@pte-app/db';

interface RegisterBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export const registerRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { email, password, firstName, lastName } = request.body || {};

    if (!email || !password || !firstName || !lastName) {
      reply.status(400).send({ error: 'Bad Request', message: 'Missing required fields' });
      return;
    }

    if (password.length < 8) {
      reply.status(400).send({ error: 'Bad Request', message: 'Password must be at least 8 characters long' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      reply.status(400).send({ error: 'Bad Request', message: 'Invalid email format' });
      return;
    }

    try {
      const config = (fastify as any).config || {
        bcryptCost: 12,
        emailVerificationExpirySecs: 3600,
        appUrl: 'http://localhost:3000',
      };

      // Check duplicate email
      const existingUser = await fastify.repositories.users.findByEmail(email);
      if (existingUser) {
        reply.status(409).send({ error: 'Conflict', message: 'Email address already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.bcryptCost);

      const result = await fastify.db.$transaction(async (tx) => {
        const txUsersRepo = createUsersRepository(tx as any);
        const txAuditRepo = createAuditRepository(tx as any);

        // 1. Create User
        const user = await txUsersRepo.createUser({
          email,
          passwordHash,
        });

        // 2. Create UserProfile
        await txUsersRepo.upsertProfile({
          userId: user.id,
          firstName,
          lastName,
        });

        // 3. Assign Role (FREE_STUDENT by default)
        const freeRole = await tx.role.findUnique({
          where: { name: RoleName.FREE_STUDENT },
        });
        if (freeRole) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: freeRole.id,
            },
          });
        }

        // 4. Create Email Verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + config.emailVerificationExpirySecs * 1000);
        await txUsersRepo.createEmailVerification({
          userId: user.id,
          token,
          expiresAt,
        });

        // 5. Append Audit Log
        await txAuditRepo.append({
          userId: user.id,
          action: AuditAction.USER_REGISTERED,
          entityType: 'User',
          entityId: user.id,
          ipAddress: request.ip,
          metadata: { email: user.email },
        });

        return { user, token };
      });

      // Send Verification Email (async/non-blocking or simple await)
      const verifyUrl = `${config.appUrl}/verify-email?token=${result.token}`;
      await fastify.emailProvider.send({
        to: email,
        subject: 'Verify your email address',
        text: `Please verify your email address by clicking this link: ${verifyUrl}`,
        html: `<p>Please verify your email address by clicking <a href="${verifyUrl}">here</a>.</p>`,
      });

      reply.status(201).send({ userId: result.user.id });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to register user' });
    }
  });
};
export default registerRoute;
