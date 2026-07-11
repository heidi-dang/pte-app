import { PrismaClient, SubscriptionStatus } from '@prisma/client';

export interface CreateSubscriptionInput {
  userId: string;
  subscriptionPlanId: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export function createSubscriptionsRepository(db: PrismaClient) {
  return {
    /** Activate a new subscription. */
    async createSubscription(input: CreateSubscriptionInput) {
      return db.subscription.create({
        data: {
          userId: input.userId,
          subscriptionPlanId: input.subscriptionPlanId,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: input.stripeSubscriptionId,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
        },
        include: { subscriptionPlan: true },
      });
    },

    /** Find the active subscription for a user. */
    async findActiveSubscription(userId: string) {
      return db.subscription.findFirst({
        where: { userId, status: SubscriptionStatus.ACTIVE },
        include: { subscriptionPlan: { include: { entitlements: true } } },
        orderBy: { currentPeriodEnd: 'desc' },
      });
    },

    /** Cancel a subscription (remains active until period end). */
    async cancelSubscription(subscriptionId: string) {
      return db.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      });
    },

    /** Expire a subscription that has passed its period end. */
    async expireSubscription(subscriptionId: string) {
      return db.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    },

    /** Update billing period after renewal. */
    async renewSubscription(subscriptionId: string, newPeriodStart: Date, newPeriodEnd: Date) {
      return db.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      });
    },

    /** Record a subscription lifecycle event. */
    async recordEvent(subscriptionId: string, eventType: string, payload: object) {
      return db.subscriptionEvent.create({
        data: { subscriptionId, eventType, payload },
      });
    },

    /** Record a received webhook (idempotent by externalId). */
    async recordWebhook(externalId: string, provider: string, eventType: string, payload: object) {
      return db.webhook.upsert({
        where: { externalId },
        create: { externalId, provider, eventType, payload },
        update: { failureCount: { increment: 0 } }, // no-op update for idempotency
      });
    },

    /** Mark a webhook as processed. */
    async markWebhookProcessed(externalId: string) {
      return db.webhook.update({
        where: { externalId },
        data: { processedAt: new Date() },
      });
    },

    /** Check if a webhook has already been processed (idempotency guard). */
    async isWebhookProcessed(externalId: string): Promise<boolean> {
      const wh = await db.webhook.findUnique({ where: { externalId } });
      return wh?.processedAt != null;
    },
  };
}
