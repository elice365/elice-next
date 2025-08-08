import { logger } from '@/lib/services/logger';

// Helper function to extract message from error object
function extractMessageFromObject(errorObj: unknown): string | null {
  const err = errorObj as Record<string, any>;
  // Check various message properties
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  
  if (err.response?.message) {
    return err.response.message;
  }
  
  if (err.data?.message) {
    return err.data.message;
  }
  
  if (err.message) {
    return err.message;
  }
  
  return null;
}

// Helper function to get HTTP status message
function getHttpStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required. Please login.',
    403: 'Access denied. You do not have permission.',
    404: 'Requested resource not found.',
    409: 'Conflict. The resource already exists.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Service temporarily unavailable.',
    503: 'Service unavailable. Please try again later.'
  };
  
  return statusMessages[status] || `Request failed with status ${status}.`;
}

/**
 * Extracts user-friendly error messages from various error types
 * Consolidates error handling across the application
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle object errors (Axios/API errors)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;
    
    // Try to extract message from object
    const message = extractMessageFromObject(errorObj);
    if (message) {
      return message;
    }
    
    // Handle HTTP status codes
    if (errorObj.response?.status) {
      return getHttpStatusMessage(errorObj.response.status);
    }
  }
  
  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Logs errors consistently across the application
 */
export function logError(context: string, error: unknown, additionalInfo?: unknown) {
  const errorMessage = extractErrorMessage(error);
  logger.error(`[${context}] ${errorMessage}`, 'ERROR', { error, additionalInfo });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown, context?: string) {
  const message = extractErrorMessage(error);
  
  if (context) {
    logError(context, error);
  }
  
  return {
    success: false,
    error: message,
    data: null
  };
}