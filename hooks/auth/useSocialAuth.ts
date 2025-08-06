/**
 * Social Authentication Hook
 * Handles social login message communication and provider loading states
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAppDispatch } from '@/stores/hook';
import { setUser } from '@/stores/slice/auth';
import { SocialAuthMessage, validators } from '@/lib/auth/utils';
import { useAuthError } from './useAuthError';

/**
 * Hook for handling social authentication messages
 * Listens for postMessage events from social login popups
 */
export const useSocialAuthMessages = (
  onSuccess?: (user: any) => void, 
  onError?: (error: string) => void
) => {
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

/**
 * Hook for managing loading states per social provider
 * Tracks which provider is currently authenticating
 */
export const useProviderLoading = () => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const setLoading = useCallback((provider: string | null) => {
    setLoadingProvider(provider);
  }, []);

  const isLoading = useCallback((provider: string) => {
    return loadingProvider === provider;
  }, [loadingProvider]);

  const isAnyLoading = useMemo(() => Boolean(loadingProvider), [loadingProvider]);

  const clearLoading = useCallback(() => {
    setLoadingProvider(null);
  }, []);

  return {
    loadingProvider,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading
  };
};