/**
 * Optimized Social Login Hook
 * Following Next.js 15.4.3 App Router patterns
 */

import { useCallback } from 'react';
import { api } from '@/lib/fetch';
import { useFingerprint } from './useFingerprint';
import { useProviderLoading, useSocialAuthMessages, useAuthError } from '@/lib/auth/hooks';
import { popupUtils, validators, extractErrorMessage } from '@/lib/auth/utils';

type SocialLoginResponse = {
  success: boolean;
  data?: { authUrl: string; fingerprint?: string };
  message?: string;
};

export const useSocialLogin = () => {
  const fingerprint = useFingerprint();
  const { loadingProvider, setLoading, isLoading, isAnyLoading } = useProviderLoading();
  const { setError } = useAuthError();
  
  // Handle social auth messages with cleanup on success/error
  useSocialAuthMessages(
    () => setLoading(null), // Clear loading on success
    () => setLoading(null)  // Clear loading on error
  );

  const handleSocialLogin = useCallback(
    async (provider: string) => {
      // Validation checks
      if (isAnyLoading || !fingerprint || !validators.isValidProvider(provider)) {
        return;
      }

      setLoading(provider);
      setError(null);

      try {
        const { data } = await api.post<SocialLoginResponse>(
          '/api/auth/social',
          { type: provider, fingerprint }
        );

        if (data?.success && data.data?.authUrl) {
          const popup = popupUtils.openAuthPopup(data.data.authUrl);
          
          // Watch for popup close to clear loading state
          popupUtils.watchPopupClose(popup, () => {
            if (isLoading(provider)) {
              setLoading(null);
            }
          });
        } else {
          const errorMsg = data?.message || 'Failed to get authentication URL';
          setError(errorMsg);
          setLoading(null);
        }
      } catch (error: unknown) {
        const errorMessage = extractErrorMessage(error);
        setError(errorMessage);
        setLoading(null);
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`Social login error (${provider}):`, error);
        }
      }
    },
    [fingerprint, isAnyLoading, isLoading, setLoading, setError]
  );

  return {
    handleSocialLogin,
    loadingProvider,
    isLoading,
    isAnyLoading
  };
};
