/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const PTE_SCORE_MIN = 10;
const PTE_SCORE_MAX = 90;

function isValidPteScore(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= PTE_SCORE_MIN && v <= PTE_SCORE_MAX;
}

interface TargetsBody {
  targetOverallScore?: number;
  targetSpeaking?: number;
  targetWriting?: number;
  targetReading?: number;
  targetListening?: number;
  examDate?: string;
}

export const onboardingTargetsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: TargetsBody }>(
    '/onboarding/targets',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { targetOverallScore, targetSpeaking, targetWriting, targetReading, targetListening, examDate } =
        request.body || {};

      // Validate score ranges
      const scoreFields: [string, unknown][] = [
        ['targetOverallScore', targetOverallScore],
        ['targetSpeaking', targetSpeaking],
        ['targetWriting', targetWriting],
        ['targetReading', targetReading],
        ['targetListening', targetListening],
      ];
      for (const [field, value] of scoreFields) {
        if (value !== undefined && !isValidPteScore(value)) {
          reply.status(400).send({
            error: 'Bad Request',
            message: `${field} must be an integer between ${PTE_SCORE_MIN} and ${PTE_SCORE_MAX}`,
          });
          return;
        }
      }

      // Validate examDate if provided
      let parsedExamDate: Date | undefined;
      if (examDate !== undefined) {
        parsedExamDate = new Date(examDate);
        if (isNaN(parsedExamDate.getTime())) {
          reply.status(400).send({ error: 'Bad Request', message: 'examDate must be a valid ISO 8601 date string' });
          return;
        }
      }

      try {
        await fastify.repositories.users.setTargets(userId, {
          targetOverallScore,
          targetSpeaking,
          targetWriting,
          targetReading,
          targetListening,
          examDate: parsedExamDate,
        } as any);

        reply.status(200).send({ message: 'Target scores updated successfully' });
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to set targets' });
      }
    },
  );
};
export default onboardingTargetsRoute;
