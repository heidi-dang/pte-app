import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const VALID_STEPS = ['profile', 'targets', 'microphone', 'complete'] as const;
type OnboardingStep = (typeof VALID_STEPS)[number];

interface StepBody {
  step?: string;
  complete?: boolean;
}

export const onboardingStepRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.patch<{ Body: StepBody }>(
    '/onboarding/step',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const { step, complete } = request.body || {};

      if (!step) {
        reply.status(400).send({ error: 'Bad Request', message: 'Missing required field: step' });
        return;
      }

      if (!VALID_STEPS.includes(step as OnboardingStep)) {
        reply.status(400).send({
          error: 'Bad Request',
          message: `Invalid step. Must be one of: ${VALID_STEPS.join(', ')}`,
        });
        return;
      }

      const isComplete = complete === true || step === 'complete';

      try {
        await fastify.repositories.users.updateOnboardingStep(userId, step, isComplete);
        reply.status(200).send({ step, complete: isComplete });
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to update onboarding step' });
      }
    },
  );
};
export default onboardingStepRoute;
