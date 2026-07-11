/**
 * Error contract.
 *
 * Every known application error carries a stable code, a human-readable
 * message, an optional detail payload and an optional correlation id.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'DEPENDENCY_FAILURE'
  | 'CONFIGURATION_ERROR';

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly correlationId?: string;
}

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  const maybe = value as Record<string, unknown>;
  return typeof maybe.code === 'string' && typeof maybe.message === 'string';
}
