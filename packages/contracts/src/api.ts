/**
 * API response contract.
 *
 * Every API response wraps the payload in a standard envelope.
 */

import type { AppError } from './error.js';
import type { PaginationMeta } from './pagination.js';

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
}

export interface ApiFailure {
  readonly ok: false;
  readonly error: AppError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function success<T>(data: T, meta?: PaginationMeta): ApiSuccess<T> {
  return { ok: true, data, meta };
}

export function failure(error: AppError): ApiFailure {
  return { ok: false, error };
}
