import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Config } from './env.js';
import dbPlugin from './plugins/db.js';
import emailPlugin from './plugins/email.js';
import authPlugin from './plugins/authenticate.js';
import authRoutes from './routes/auth/index.js';

export type App = FastifyInstance;

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  // Decorate with config for route use
  app.decorate('config', config);

  await app.register(cors, { origin: config.webOrigin });

  // Register local plugins
  await app.register(dbPlugin);
  await app.register(emailPlugin);
  await app.register(authPlugin);

  // Register routes
  await app.register(authRoutes, { prefix: '/auth' });

  app.get('/health/live', async () => ({
    service: 'api',
    status: 'ok',
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', async () => ({
    service: 'api',
    status: 'ok',
    ready: true,
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  return app;
}
