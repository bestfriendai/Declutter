export class AppError extends Error {
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

class AIServiceError extends AppError {
  constructor(name: string, message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message, options);
    this.name = name;
  }
}

export class AIAnalysisError extends AIServiceError {
  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super('AIAnalysisError', message, options);
  }
}

export class AIProgressError extends AIServiceError {
  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super('AIProgressError', message, options);
  }
}

export class AIMotivationError extends AIServiceError {
  constructor(message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super('AIMotivationError', message, options);
  }
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown error');
}
