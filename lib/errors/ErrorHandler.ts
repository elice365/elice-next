/**
 * Centralized error handling utility
 * Provides consistent error processing and logging across the application
 */

import { ApiError, ErrorContext } from './ApiError';
import { logger } from '@/utils/logger';

export interface ErrorHandlerOptions {
  context?: ErrorContext;
  includeStack?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  sanitizeForUser?: boolean;
}

/**
 * Central error handler with structured logging and user-safe responses
 */
export class ErrorHandler {
  /**
   * Process and log an error, return appropriate response
   */
  static handle(
    error: unknown,
    operation: string,
    options: ErrorHandlerOptions = {}
  ) {
    const {
      context = 'UNKNOWN',
      includeStack = false,
      logLevel = 'error',
      sanitizeForUser = true
    } = options;

    // Convert to structured ApiError if needed
    const apiError = this.toApiError(error, operation, context);
    
    // Log the error
    this.logError(apiError, logLevel);

    // Return user-safe response
    return {
      success: false,
      error: {
        code: apiError.code,
        message: sanitizeForUser ? apiError.getUserMessage() : apiError.message,
        context: apiError.context,
        ...(includeStack && { trace: apiError.trace })
      },
      statusCode: apiError.statusCode
    };
  }

  /**
   * Convert unknown error to structured ApiError
   */
  private static toApiError(
    error: unknown, 
    operation: string, 
    context: ErrorContext
  ): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiError(
        `${context.toLowerCase()}.${operation}`,
        error.message,
        context,
        500,
        { originalError: error.name },
        error
      );
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new ApiError(
        `${context.toLowerCase()}.${operation}`,
        error,
        context
      );
    }

    // Handle unknown error types
    return new ApiError(
      `${context.toLowerCase()}.${operation}`,
      'An unknown error occurred',
      context,
      500,
      { originalError: String(error) }
    );
  }

  /**
   * Log error using structured logger
   */
  private static logError(apiError: ApiError, level: 'debug' | 'info' | 'warn' | 'error') {
    const logData = {
      code: apiError.code,
      context: apiError.context,
      statusCode: apiError.statusCode,
      details: apiError.details,
      timestamp: apiError.timestamp
    };

    // Map error context to logger context
    const loggerContext = this.mapErrorContextToLogger(apiError.context);

    switch (level) {
      case 'debug':
        logger.debug(apiError.message, loggerContext, logData);
        break;
      case 'info':
        logger.info(apiError.message, loggerContext, logData);
        break;
      case 'warn':
        logger.warn(apiError.message, loggerContext, logData);
        break;
      case 'error':
        logger.error(apiError.message, loggerContext, logData);
        break;
    }
  }

  /**
   * Map ErrorContext to LogContext for logger compatibility
   */
  private static mapErrorContextToLogger(context: ErrorContext): import('@/utils/logger').LogContext {
    const mapping: Record<ErrorContext, import('@/utils/logger').LogContext> = {
      'AUTH': 'AUTH',
      'BLOG': 'API',
      'USER': 'API', 
      'CATEGORY': 'API',
      'NOTIFICATION': 'API',
      'DATABASE': 'DB',
      'VALIDATION': 'API',
      'RATE_LIMIT': 'API',
      'UNKNOWN': 'GENERAL'
    };

    return mapping[context] || 'GENERAL';
  }

  /**
   * Extract user-friendly error message from various error types
   */
  static extractUserMessage(error: unknown): string {
    if (error instanceof ApiError) {
      return error.getUserMessage();
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred';
  }

  /**
   * Check if error is a specific type of ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Check if error indicates a client-side problem (4xx status codes)
   */
  static isClientError(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
  }

  /**
   * Check if error indicates a server-side problem (5xx status codes)
   */
  static isServerError(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.statusCode >= 500;
    }
    return false;
  }

  /**
   * Create standardized API response from error
   */
  static toApiResponse(error: unknown, operation: string, context: ErrorContext) {
    const handled = this.handle(error, operation, { 
      context, 
      sanitizeForUser: true 
    });

    return {
      success: false,
      data: null,
      error: handled.error,
      meta: {
        timestamp: new Date().toISOString(),
        operation,
        context
      }
    };
  }
}

/**
 * Convenience functions for common error handling patterns
 */
export const handleAuthError = (error: unknown, operation: string) =>
  ErrorHandler.handle(error, operation, { context: 'AUTH' });

export const handleBlogError = (error: unknown, operation: string) =>
  ErrorHandler.handle(error, operation, { context: 'BLOG' });

export const handleDatabaseError = (error: unknown, operation: string) =>
  ErrorHandler.handle(error, operation, { context: 'DATABASE' });

export const handleValidationError = (error: unknown, operation: string) =>
  ErrorHandler.handle(error, operation, { context: 'VALIDATION' });

/**
 * Async error handling wrapper
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string,
  context: ErrorContext = 'UNKNOWN'
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = ErrorHandler.handle(error, operation, { context });
      throw new ApiError(
        handled.error.code,
        handled.error.message,
        context,
        handled.statusCode
      );
    }
  };
};