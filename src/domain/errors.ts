export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'http'
  | 'not-found'
  | 'unauthorized'
  | 'rate-limited'
  | 'parse'
  | 'invalid-data';

export interface AppErrorOptions {
  status?: number;
  retryAfterMs?: number;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status?: number;
  readonly retryAfterMs?: number;
  override readonly cause?: unknown;

  constructor(kind: AppErrorKind, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    this.cause = options.cause;
  }
}

export function toAppError(error: unknown, fallback = 'Request failed'): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError('network', error.message, { cause: error });
  }
  return new AppError('network', fallback, { cause: error });
}

