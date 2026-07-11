import type { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from './password.js';
import { createToken, createSessionId } from './session.js';
import { requireAuth } from '../middleware/auth.js';

interface RegisterBody {
  email: string;
  password: string;
  displayName: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register
  app.post<{ Body: RegisterBody }>('/auth/register', async (request, reply) => {
    const { email, password, displayName } = request.body;

    if (!email || !password || !displayName) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'email, password and displayName are required' },
      });
    }

    if (password.length < 8) {
      return reply
        .status(400)
        .send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' } });
    }

    // TODO: persist user to database
    const userId = `usr_${Date.now().toString(36)}`;
    const passwordHash = hashPassword(password);
    const sessionId = createSessionId();
    const token = createToken({ userId, role: 'free_student', sessionId });

    return reply.status(201).send({
      ok: true,
      data: {
        userId,
        token,
        profile: { displayName, email },
      },
    });
  });

  // POST /auth/login
  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply
        .status(400)
        .send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'email and password are required' } });
    }

    // TODO: look up user from database and verify password hash
    const userId = `usr_${Date.now().toString(36)}`;
    const sessionId = createSessionId();
    const token = createToken({ userId, role: 'free_student', sessionId });

    return reply.send({
      ok: true,
      data: { userId, token, profile: { displayName: email, email } },
    });
  });

  // GET /auth/me
  app.get('/auth/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.sessionPayload!;
    // TODO: load user from database
    return reply.send({
      ok: true,
      data: { userId: payload.userId, role: payload.role },
    });
  });
}
