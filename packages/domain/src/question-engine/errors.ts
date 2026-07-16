import type { QuestionEngineErrorCode } from '@pte-app/contracts';

export class QuestionEngineError extends Error {
  constructor(
    public readonly code: QuestionEngineErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'QuestionEngineError';
    Object.setPrototypeOf(this, QuestionEngineError.prototype);
  }
}

export function createEngineError(
  code: QuestionEngineErrorCode,
  message: string,
  details?: Record<string, unknown>,
): QuestionEngineError {
  return new QuestionEngineError(code, message, details);
}
