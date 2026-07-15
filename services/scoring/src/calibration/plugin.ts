import type { FastifyInstance } from 'fastify';

export async function calibrationPlugin(app: FastifyInstance): Promise<void> {
  await app.register(
    async function routes(instance) {
      instance.get('/calibration/datasets', async () => ({ status: 'structural' }));
    },
    { prefix: '/api/scoring' },
  );
}
