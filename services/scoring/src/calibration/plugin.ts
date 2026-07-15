import type { FastifyInstance } from 'fastify';
import { CalibrationService } from './service.js';
import type { CalibrationRepository } from './repository.js';
import { registerCalibrationRoutes } from './routes.js';

export async function calibrationPlugin(app: FastifyInstance): Promise<void> {
  const repo: CalibrationRepository = {
    findAllDatasets: async () => [],
    findDatasetForProfile: async () => null,
    findReportByDataset: async () => null,
  };
  const service = new CalibrationService(repo);
  registerCalibrationRoutes(app, service);
}
