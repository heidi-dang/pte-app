import type { FastifyInstance } from 'fastify';
import { staffRoutes } from './routes.js';

export async function staffPlugin(app: FastifyInstance): Promise<void> {
  await app.register(staffRoutes, { prefix: '/api/staff' });
}
