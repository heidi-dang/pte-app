/**
 * Provider-adapter interfaces.
 *
 * Every external dependency (AI model, payment, email, storage, SMS)
 * must be behind an adapter to remain replaceable.
 */

/** Generic provider adapter lifecycle. */
export interface ProviderAdapter {
  readonly name: string;
  readonly healthCheck: () => Promise<boolean>;
}

/** AI evaluation provider. */
export interface EvaluationProvider extends ProviderAdapter {
  evaluate(prompt: string, input: unknown): Promise<EvaluationResult>;
}

export interface EvaluationResult {
  readonly score?: number;
  readonly confidence?: number;
  readonly evidence: Record<string, unknown>;
  readonly raw?: unknown;
}

/** Payment provider. */
export interface PaymentProvider extends ProviderAdapter {
  createCheckout: (plan: unknown, userId: string) => Promise<{ url: string; id: string }>;
  handleWebhook: (payload: unknown, signature: string) => Promise<PaymentEvent>;
}

export interface PaymentEvent {
  readonly type: 'payment_succeeded' | 'payment_failed' | 'subscription_cancelled';
  readonly providerId: string;
  readonly raw: unknown;
}

/** Email provider. */
export interface EmailProvider extends ProviderAdapter {
  send: (to: string, subject: string, body: string) => Promise<void>;
}

/** Object storage provider. */
export interface StorageProvider extends ProviderAdapter {
  upload: (key: string, data: Buffer | ReadableStream, contentType: string) => Promise<string>;
  getUrl: (key: string) => Promise<string>;
  delete: (key: string) => Promise<void>;
}
