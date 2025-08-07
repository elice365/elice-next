/**
 * Extracts user-friendly error messages from various error types
 * Consolidates error handling across the application
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle Axios/API errors with response data
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    
    // Check for response.data.message (API errors)
    if (errorObj.response?.data?.message) {
      return errorObj.response.data.message;
    }
    
    // Check for response.message
    if (errorObj.response?.message) {
      return errorObj.response.message;
    }
    
    // Check for data.message
    if (errorObj.data?.message) {
      return errorObj.data.message;
    }
    
    // Check for message property
    if (errorObj.message) {
      return errorObj.message;
    }
    
    // Handle HTTP status codes
    if (errorObj.response?.status) {
      const status = errorObj.response.status;
      switch (status) {
        case 400: return 'Bad request. Please check your input.';
        case 401: return 'Authentication required. Please login.';
        case 403: return 'Access denied. You do not have permission.';
        case 404: return 'Requested resource not found.';
        case 409: return 'Conflict. The resource already exists.';
        case 429: return 'Too many requests. Please try again later.';
        case 500: return 'Server error. Please try again later.';
        case 502: return 'Bad gateway. Service temporarily unavailable.';
        case 503: return 'Service unavailable. Please try again later.';
        default: return `Request failed with status ${status}.`;
      }
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Logs errors consistently across the application
 */
export function logError(context: string, error: unknown, additionalInfo?: any) {
  const errorMessage = extractErrorMessage(error);
  console.error(`[${context}] ${errorMessage}`, { error, additionalInfo });
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