/**
 * Phase T — Payments, Subscriptions and Entitlements
 */

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly currency: string;
  readonly interval: 'month' | 'year';
  readonly features: string[];
}

export interface Subscription {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly status: 'active' | 'past_due' | 'cancelled' | 'expired';
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly cancelAtPeriodEnd: boolean;
}

export interface PaymentEvent {
  readonly id: string;
  readonly type: 'payment_succeeded' | 'payment_failed' | 'subscription_created' | 'subscription_cancelled';
  readonly providerId: string;
  readonly amount: number;
  readonly currency: string;
  readonly userId: string;
  readonly processed: boolean;
}

export class PaymentService {
  async getPlans(): Promise<Plan[]> {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['Basic lessons', 'Limited practice'],
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: ['All lessons', 'Unlimited practice', 'Mock exams', 'Progress reports'],
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 249,
        currency: 'USD',
        interval: 'year',
        features: ['All features', '2 months free'],
      },
    ];
  }

  async createCheckout(planId: string, userId: string): Promise<{ url: string; sessionId: string }> {
    return { url: `/checkout/${planId}`, sessionId: `cs_${Date.now().toString(36)}` };
  }

  async handleWebhook(event: PaymentEvent): Promise<void> {
    // Idempotent webhook processing
  }
}
