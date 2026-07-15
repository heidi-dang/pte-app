import type { QuestionTypeHandler } from '@pte-app/contracts';
import { createEngineError } from './errors.js';

export interface HandlerRegistry {
  register(handler: QuestionTypeHandler): void;
  resolve(type: string): QuestionTypeHandler;
  listRegistered(): string[];
}

export function createHandlerRegistry(): HandlerRegistry {
  const handlers = new Map<string, QuestionTypeHandler>();

  return {
    register(handler: QuestionTypeHandler) {
      const type = handler.manifest.type;
      if (handlers.has(type)) {
        throw createEngineError(
          'INVALID_RESPONSE_PAYLOAD', // or standard registration duplicate error
          `Handler for question type '${type}' is already registered`
        );
      }
      handlers.set(type, handler);
    },
    resolve(type: string): QuestionTypeHandler {
      const handler = handlers.get(type);
      if (!handler) {
        throw createEngineError(
          'UNSUPPORTED_QUESTION_TYPE',
          `No question type handler registered for type '${type}'`
        );
      }
      return handler;
    },
    listRegistered(): string[] {
      return Array.from(handlers.keys());
    },
  };
}
