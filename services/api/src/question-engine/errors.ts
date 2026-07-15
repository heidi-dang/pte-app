import type { QuestionEngineErrorCode } from '@pte-app/contracts';

export interface HttpErrorResponse {
  statusCode: number;
  errorCode: QuestionEngineErrorCode;
  message: string;
}

const ERROR_CODE_TO_STATUS: Record<QuestionEngineErrorCode, number> = {
  UNSUPPORTED_QUESTION_TYPE: 400,
  QUESTION_VERSION_MISMATCH: 400,
  INVALID_SESSION_TRANSITION: 400,
  STALE_RESPONSE_REVISION: 409,
  INVALID_RESPONSE_PAYLOAD: 422,
  RESPONSE_TOO_LARGE: 413,
  SESSION_NOT_OWNED: 403,
  SESSION_EXPIRED: 403,
  SESSION_ALREADY_SUBMITTED: 409,
  IDEMPOTENCY_CONFLICT: 409,
  PLAYBACK_NOT_ALLOWED: 403,
  PLAYBACK_ALREADY_CONSUMED: 403,
  TRANSCRIPT_NOT_AUTHORISED: 403,
  RENDERER_CONTRACT_MISMATCH: 400,
  MISSING_MODE_PROFILE: 400,
  INCOMPATIBLE_MODE_PROFILE: 400,
  MISSING_TIMER_DISPLAY_PROFILE: 400,
};

export function mapErrorCodeToStatus(code: QuestionEngineErrorCode): number {
  return ERROR_CODE_TO_STATUS[code] || 500;
}

interface RawEngineError {
  code?: QuestionEngineErrorCode;
  message?: string;
}

export function toHttpError(error: unknown): HttpErrorResponse {
  const typed = (typeof error === 'object' && error !== null ? error : {}) as RawEngineError;
  const code: QuestionEngineErrorCode = typed.code || 'INVALID_RESPONSE_PAYLOAD';
  const statusCode = mapErrorCodeToStatus(code);
  return {
    statusCode,
    errorCode: code,
    message: typed.message || 'An unexpected question engine error occurred',
  };
}
