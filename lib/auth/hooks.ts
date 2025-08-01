/**
 * Optimized Authentication Hooks
 * Reusable hooks following Next.js 15.4.3 patterns
 */

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { selectAuthError, setUser, setError as setAuthError, clearError } from '@/stores/slice/auth';
import { SocialAuthMessage, validators } from './utils';

// Enhanced error state management hook
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

  return { error, setError };
};

// Optimized social login message handler
export const useSocialAuthMessages = (onSuccess?: (user: any) => void, onError?: (error: string) => void) => {
  const dispatch = useAppDispatch();
  const { setError } = useAuthError();

  const handleMessage = useCallback((event: MessageEvent<SocialAuthMessage>) => {
    // Security check
    if (!validators.isValidOrigin(event.origin)) return;

    const { type, user, error, message } = event.data;

    switch (type) {
      case 'SOCIAL_LOGIN_SUCCESS':
        if (user) {
          dispatch(setUser(user));
          setError(null);
          onSuccess?.(user);
        }
        break;
      case 'SOCIAL_LOGIN_ACCOUNT_ERROR': {
        const accountError = message!;
        setError(accountError);
        onError?.(accountError);
        break;
      }

      case 'SOCIAL_LOGIN_ERROR': {
        const loginError = error!;
        setError(loginError);
        onError?.(loginError);
        break;
      }
    }

  }, [dispatch, setError, onSuccess, onError]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return handleMessage;
};

// Form error display hook with memoization
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

// Loading state management for individual providers
export const useProviderLoading = () => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const setLoading = useCallback((provider: string | null) => {
    setLoadingProvider(provider);
  }, []);

  const isLoading = useCallback((provider: string) => {
    return loadingProvider === provider;
  }, [loadingProvider]);

  const isAnyLoading = useMemo(() => Boolean(loadingProvider), [loadingProvider]);

  return {
    loadingProvider,
    setLoading,
    isLoading,
    isAnyLoading
  };
};