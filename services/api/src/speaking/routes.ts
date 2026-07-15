import type { FastifyInstance } from 'fastify';
import type { SpeakingService } from './service.js';

export function registerSpeakingRoutes(app: FastifyInstance, service: SpeakingService): void {
  app.post('/speaking/recordings', async (request, reply) => {
    const { sessionId, userId, recordingProfileId } = request.body as {
      sessionId: string;
      userId: string;
      recordingProfileId: string;
    };
    const result = await service.startRecording(sessionId, userId, recordingProfileId);
    return reply.status(201).send(result);
  });

  app.patch('/speaking/recordings/:id/state', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { state } = request.body as { state: string };
    await service.transitionRecordingState(id, state);
    return reply.status(200).send({ ok: true });
  });
}
