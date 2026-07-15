import type { FastifyInstance } from 'fastify';
import { operationsRoutes } from './routes.js';

export async function operationsPlugin(app: FastifyInstance): Promise<void> {
  await app.register(operationsRoutes, { prefix: '/api/operations' });
}
