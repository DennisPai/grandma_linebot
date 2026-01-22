import { logger } from './logger.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}

/**
 * 全域錯誤處理器
 */
export function handleError(error: Error | AppError, context?: string) {
  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn(`Operational error in ${context}:`, error);
    } else {
      logger.error(`Programming error in ${context}:`, error);
    }
  } else {
    logger.error(`Unexpected error in ${context}:`, error);
  }
}

/**
 * 安全地執行非同步函數並處理錯誤
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error, context);
    return fallback;
  }
}
