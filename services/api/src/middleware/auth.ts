import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, type SessionPayload } from '../auth/session.js';

declare module 'fastify' {
  interface FastifyRequest {
    sessionPayload?: SessionPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply
      .status(401)
      .send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    reply.status(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    return;
  }

  request.sessionPayload = payload;
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!request.sessionPayload || !roles.includes(request.sessionPayload.role)) {
      reply
        .status(403)
        .send({ ok: false, error: { code: 'FORBIDDEN', message: `Required role: ${roles.join(' or ')}` } });
      return;
    }
  };
}
