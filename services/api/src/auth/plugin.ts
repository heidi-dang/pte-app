import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { loadAuthConfig } from './config.js';
import { registerAccount, authenticateAccount, getAccountById } from './accounts.js';
import {
  createSession,
  validateSession,
  revokeSession,
  revokeOtherSessions,
  listUserSessions,
  cleanupOldSessions,
} from './sessions.js';
import { hasPermission, type UserRole, ALL_ROLES } from './rbac.js';

export interface AuthContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly roles: UserRole[];
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export interface AuthPluginOptions {
  readonly db: DatabaseConnection;
}

function getSessionToken(request: FastifyRequest): string | undefined {
  const cookie = request.headers.cookie;
  if (cookie) {
    const config = loadAuthConfig();
    const match = cookie.match(new RegExp(`${config.cookieName}=([^;]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

export async function authPlugin(app: FastifyInstance, options: AuthPluginOptions): Promise<void> {
  const config = loadAuthConfig();
  const { db } = options;

  app.decorateRequest('auth', undefined);

  app.addHook('onRequest', async (request: FastifyRequest) => {
    const token = getSessionToken(request);
    if (!token) return;

    const session = await validateSession(db, token);
    if (!session) return;

    const account = await getAccountById(db, session.userId);
    if (!account || account.disabled) return;

    request.auth = {
      userId: session.userId,
      sessionId: session.sessionId,
      roles: account.roles,
    };
  });

  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string; password?: string; displayName?: string };
    if (!body?.email || !body?.password || !body?.displayName) {
      return reply.status(400).send({ error: 'Email, password and displayName are required' });
    }
    if (body.password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const account = await registerAccount(db, config, {
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      });
      const { token, session } = await createSession(db, config, account.id, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      void reply.setCookie?.(config.cookieName, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.sessionDurationMinutes * 60,
      });

      return reply.status(201).send({
        user: { id: account.id, email: account.email, roles: account.roles },
        session: { id: session.id, expiresAt: session.expiresAt },
        token,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unique')) {
        return reply.status(409).send({ error: 'Account already exists' });
      }
      throw err;
    }
  });

  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const account = await authenticateAccount(db, body.email, body.password);
    if (!account) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    await cleanupOldSessions(db, account.id, config.maxSessionsPerUser);

    const { token, session } = await createSession(db, config, account.id, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    void reply.setCookie?.(config.cookieName, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.sessionDurationMinutes * 60,
    });

    return reply.status(200).send({
      user: { id: account.id, email: account.email, roles: account.roles },
      session: { id: session.id, expiresAt: session.expiresAt },
      token,
    });
  });

  app.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    await revokeSession(db, request.auth.sessionId);
    void reply.clearCookie?.(config.cookieName, { path: '/' });
    return reply.status(200).send({ ok: true });
  });

  app.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const account = await getAccountById(db, request.auth.userId);
    if (!account || account.disabled) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return reply.status(200).send({
      user: { id: account.id, email: account.email, roles: account.roles },
    });
  });

  app.get('/auth/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const sessions = await listUserSessions(db, request.auth.userId);
    return reply.status(200).send({ sessions });
  });

  app.delete('/auth/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = request.params as { id: string };
    const sessions = await listUserSessions(db, request.auth.userId);
    if (!sessions.some((s) => s.id === id)) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    await revokeSession(db, id);
    return reply.status(200).send({ ok: true });
  });

  app.delete('/auth/sessions/others', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    await revokeOtherSessions(db, request.auth.userId, request.auth.sessionId);
    return reply.status(200).send({ ok: true });
  });

  app.get('/auth/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return reply.status(200).send({ permissions: ALL_ROLES });
  });
}

export function requireAuth(request: FastifyRequest, reply: FastifyReply): AuthContext {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    throw new Error('Unauthorized');
  }
  return request.auth;
}

export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const auth = requireAuth(request, reply);
    if (!hasPermission(auth.roles, permission)) {
      reply.status(403).send({ error: 'Forbidden' });
      throw new Error('Forbidden');
    }
  };
}

export { hasPermission };
export type { UserRole };
