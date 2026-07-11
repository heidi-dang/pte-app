/**
 * Logging contract.
 *
 * Structured log entries used across all services.
 */

export interface LogEntry {
  readonly level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  readonly message: string;
  readonly service: string;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly userId?: string;
  readonly error?: { code?: string; message?: string; stack?: string };
  readonly [key: string]: unknown;
}

export interface Logger {
  fatal(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  debug(msg: string, meta?: Record<string, unknown>): void;
  trace(msg: string, meta?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}
