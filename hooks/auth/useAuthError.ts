/**
 * Authentication Error Management Hook
 * Handles error state for authentication operations
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { selectAuthError, setError as setAuthError, clearError } from '@/stores/slice/auth';

/**
 * Hook for managing authentication error state
 * Provides error state and methods to set/clear errors
 */
export const useAuthError = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);

  const setError = useCallback((error: string | null) => {
    if (error) {
      dispatch(setAuthError(error));
    } else {
      dispatch(clearError());
    }
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return { 
    error, 
    setError,
    clearError: clearAuthError 
  };
};