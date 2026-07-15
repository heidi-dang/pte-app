import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { createConnection, checkHealth, runMigrations } from '@pte-app/database';
import { Config } from './env.js';
import { authPlugin, getSessionToken } from './auth/plugin.js';
import { validateSession } from './auth/sessions.js';
import { getAccountById } from './auth/accounts.js';
import { contentProvenancePlugin } from './content-provenance/plugin.js';
import { phaseHPlugin } from './phase-h/plugin.js';

export type App = FastifyInstance;

export async function buildApp(config: Config, options: { skipDb?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  await app.register(cors, { origin: config.webOrigin, credentials: true });
  await app.register(cookie);

  let dbConnection: Awaited<ReturnType<typeof createConnection>> | undefined;
  if (!options.skipDb) {
    dbConnection = await createConnection(config.database, (attempt) => {
      app.log.info(`Database connection attempt ${attempt}`);
    });
    await runMigrations(dbConnection, {
      onProgress: (version) => app.log.info(`Applying migration ${version}`),
    });
    app.addHook('onClose', async () => {
      await dbConnection?.close();
    });
  }

  app.get('/health/live', async () => ({
    service: 'api',
    status: 'ok',
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', async () => {
    if (!dbConnection) {
      return {
        service: 'api',
        status: 'ok',
        ready: true,
        version: config.version,
        timestamp: new Date().toISOString(),
      };
    }
    const health = await checkHealth(dbConnection);
    return {
      service: 'api',
      status: health.healthy ? 'ok' : 'error',
      ready: health.healthy,
      database: { healthy: health.healthy, latencyMs: health.latencyMs },
      version: config.version,
      timestamp: new Date().toISOString(),
    };
  });

  if (dbConnection) {
    app.decorateRequest('auth', undefined);

    app.addHook('onRequest', async (request: FastifyRequest) => {
      const token = getSessionToken(request);
      if (!token) return;

      const session = await validateSession(dbConnection, token);
      if (!session) return;

      const account = await getAccountById(dbConnection, session.userId);
      if (!account || account.disabled) return;

      request.auth = {
        userId: session.userId,
        sessionId: session.sessionId,
        roles: account.roles,
      };
    });

    await app.register(authPlugin, { db: dbConnection });
    await app.register(contentProvenancePlugin, { db: dbConnection });
    await app.register(phaseHPlugin, { db: dbConnection });
  }

  return app;
}
