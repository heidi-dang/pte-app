/**
 * Request and correlation identifiers contract.
 */

/** Unique identifier for every incoming request. */
export type RequestId = string & { readonly __brand: 'RequestId' };

/** Stable correlation id propagated across service boundaries. */
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };

let reqCounter = 0;

export function createRequestId(): RequestId {
  return `req_${Date.now().toString(36)}_${(reqCounter++).toString(36)}` as RequestId;
}

export function createCorrelationId(): CorrelationId {
  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` as CorrelationId;
}
