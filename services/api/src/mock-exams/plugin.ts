import type { FastifyInstance } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { MockExamService } from './service.js';
import { registerMockExamRoutes } from './routes.js';

export async function mockExamPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const service = new MockExamService(options.db);
  registerMockExamRoutes(app, service);
}
