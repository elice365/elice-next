/**
 * Structured API error classes for better error handling and debugging
 * Improves error consistency across the application
 */

export type ErrorContext = 
  | 'AUTH' 
  | 'BLOG' 
  | 'USER' 
  | 'CATEGORY' 
  | 'NOTIFICATION' 
  | 'DATABASE' 
  | 'VALIDATION' 
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export interface ErrorDetails {
  code: string;
  message: string;
  context: ErrorContext;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: Date;
  trace?: string;
}

/**
 * Base API Error class with structured error information
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly trace?: string;

  constructor(
    code: string,
    message: string,
    context: ErrorContext = 'UNKNOWN',
    statusCode: number = 500,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.trace = cause?.stack;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert error to structured object for logging/API responses
   */
  public toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      trace: this.trace,
    };
  }

  /**
   * Create user-friendly error message (hide sensitive details)
   */
  public getUserMessage(): string {
    // Return generic messages for sensitive errors
    if (this.statusCode >= 500) {
      return 'An internal server error occurred. Please try again later.';
    }
    
    return this.message;
  }
}

/**
 * Authentication-specific errors
 */
export class AuthError extends ApiError {
  constructor(
    operation: string,
    message: string,
    statusCode: number = 401,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      `auth.${operation}`,
      message,
      'AUTH',
      statusCode,
      details,
      cause
    );
    this.name = 'AuthError';
  }

  static invalidCredentials(details?: Record<string, any>) {
    return new AuthError(
      'invalid_credentials',
      'Invalid email or password',
      401,
      details
    );
  }

  static tokenExpired(details?: Record<string, any>) {
    return new AuthError(
      'token_expired',
      'Authentication token has expired',
      401,
      details
    );
  }

  static accountSuspended(details?: Record<string, any>) {
    return new AuthError(
      'account_suspended',
      'Account has been suspended',
      403,
      details
    );
  }
}

/**
 * Blog-specific errors
 */
export class BlogError extends ApiError {
  constructor(
    operation: string,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      `blog.${operation}`,
      message,
      'BLOG',
      statusCode,
      details,
      cause
    );
    this.name = 'BlogError';
  }

  static notFound(uid: string) {
    return new BlogError(
      'not_found',
      'Blog post not found',
      404,
      { uid }
    );
  }

  static alreadyLiked(details?: Record<string, any>) {
    return new BlogError(
      'already_liked',
      'Post already liked by user',
      409,
      details
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ApiError {
  constructor(
    field: string,
    message: string,
    value?: any,
    cause?: Error
  ) {
    super(
      `validation.${field}`,
      message,
      'VALIDATION',
      400,
      { field, value },
      cause
    );
    this.name = 'ValidationError';
  }

  static required(field: string) {
    return new ValidationError(
      field,
      `${field} is required`
    );
  }

  static invalid(field: string, value: any, reason?: string) {
    const reasonSuffix = reason ? `: ${reason}` : '';
    const message = `Invalid ${field}${reasonSuffix}`;
    
    return new ValidationError(
      field,
      message,
      value
    );
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends ApiError {
  constructor(
    operation: string,
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(
      `database.${operation}`,
      message,
      'DATABASE',
      500,
      details,
      cause
    );
    this.name = 'DatabaseError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends ApiError {
  constructor(
    limit: number,
    window: string,
    retryAfter?: number
  ) {
    super(
      'rate_limit.exceeded',
      `Rate limit exceeded: ${limit} requests per ${window}`,
      'RATE_LIMIT',
      429,
      { limit, window, retryAfter }
    );
    this.name = 'RateLimitError';
  }
}