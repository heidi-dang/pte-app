import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ScoringConfig } from './env.js';

export type App = FastifyInstance;

export async function buildApp(config: ScoringConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  await app.register(cors, { origin: config.webOrigin });

  app.get('/health/live', async () => ({
    service: 'scoring',
    status: 'ok',
    foundationOnly: true,
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', async () => ({
    service: 'scoring',
    status: 'ok',
    ready: true,
    foundationOnly: true,
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  return app;
}
