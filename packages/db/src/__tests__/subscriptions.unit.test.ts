// Unit tests for the subscriptions repository.
// Uses a mock PrismaClient — no live database required.

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { createSubscriptionsRepository } from '../repositories/subscriptions.js';
import { SubscriptionStatus } from '@prisma/client';

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    subscription: {
      create: mock.fn(async (args: any) => ({ id: 'sub1', ...args })),
      findFirst: mock.fn(async () => null),
      update: mock.fn(async (args: any) => ({ id: 'sub1', ...args })),
    },
    subscriptionEvent: {
      create: mock.fn(async (args: any) => ({ id: 'se1', ...args })),
    },
    webhook: {
      upsert: mock.fn(async (args: any) => ({ id: 'wh1', ...args })),
      update: mock.fn(async (args: any) => ({ id: 'wh1', ...args })),
      findUnique: mock.fn(async () => null),
    },
    ...overrides,
  } as any;
}

describe('Subscriptions repository', () => {
  it('createSubscription activates new subscription', async () => {
    const db = makeMockDb();
    const repo = createSubscriptionsRepository(db);
    const start = new Date();
    const end = new Date();

    await repo.createSubscription({
      userId: 'u1',
      subscriptionPlanId: 'plan1',
      stripeSubscriptionId: 'sub_123',
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });

    const calls = (db.subscription.create as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as { data: { status: SubscriptionStatus; stripeSubscriptionId: string } };
    assert.equal(args.data.status, SubscriptionStatus.ACTIVE);
    assert.equal(args.data.stripeSubscriptionId, 'sub_123');
  });

  it('cancelSubscription flags subscription cancelAtPeriodEnd', async () => {
    const db = makeMockDb();
    const repo = createSubscriptionsRepository(db);

    await repo.cancelSubscription('sub1');

    const calls = (db.subscription.update as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { id: string };
      data: { cancelAtPeriodEnd: boolean; cancelledAt: unknown };
    };
    assert.equal(args.where.id, 'sub1');
    assert.equal(args.data.cancelAtPeriodEnd, true);
    assert.ok(args.data.cancelledAt instanceof Date);
  });

  it('recordWebhook performs idempotent upsert using externalId', async () => {
    const db = makeMockDb();
    const repo = createSubscriptionsRepository(db);

    await repo.recordWebhook('evt_123', 'stripe', 'invoice.paid', { id: 'evt_123' });

    const calls = (db.webhook.upsert as any).mock.calls;
    assert.equal(calls.length, 1);
    const args = calls[0]!.arguments[0] as {
      where: { externalId: string };
      create: { externalId: string; provider: string };
    };
    assert.equal(args.where.externalId, 'evt_123');
    assert.equal(args.create.externalId, 'evt_123');
    assert.equal(args.create.provider, 'stripe');
  });

  it('isWebhookProcessed returns true if processedAt is populated', async () => {
    const db = makeMockDb({
      webhook: {
        findUnique: mock.fn(async () => ({ externalId: 'evt_123', processedAt: new Date() })),
      },
    });
    const repo = createSubscriptionsRepository(db);

    const processed = await repo.isWebhookProcessed('evt_123');
    assert.equal(processed, true);
  });
});
