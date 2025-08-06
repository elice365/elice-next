/**
 * Form Error Display Hook
 * Formats and displays authentication form errors
 */

import { useMemo } from 'react';
import { useAuthError } from './useAuthError';

/**
 * Hook for displaying form errors with proper formatting
 * Handles different error types and formats them for display
 */
export const useFormErrorDisplay = () => {
  const { error } = useAuthError();

  const displayError = useMemo(() => {
    if (!error) return null;

    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'An error occurred';
  }, [error]);

  return displayError;
};