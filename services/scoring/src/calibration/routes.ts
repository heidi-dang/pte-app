import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CalibrationService } from './service.js';

export function registerCalibrationRoutes(app: FastifyInstance, service: CalibrationService): void {
  app.get('/calibration/datasets', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return { status: 'structural', datasets: await service.listDatasets() };
  });
  app.post('/calibration/promote', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { profileId, profileVersion } = req.body as { profileId: string; profileVersion: number };
    const result = await service.evaluatePromotion(profileId, profileVersion, []);
    return { passed: result.passed, failures: result.failures };
  });
  app.get(
    '/calibration/reports/:datasetId',
    async (req: FastifyRequest<{ Params: { datasetId: string } }>, _reply: FastifyReply) => {
      return { report: await service.getReport(req.params.datasetId) };
    },
  );
}
