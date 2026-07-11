import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Config } from './env.js';

export type App = FastifyInstance;

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  await app.register(cors, { origin: config.webOrigin });

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
