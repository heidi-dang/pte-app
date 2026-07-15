import type { FastifyInstance } from 'fastify';
import { contentFactoryRoutes } from './routes.js';

export async function contentFactoryPlugin(app: FastifyInstance): Promise<void> {
  await app.register(contentFactoryRoutes, { prefix: '/api/content-factory' });
}
