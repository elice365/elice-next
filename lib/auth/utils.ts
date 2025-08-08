  /**
 * Shared Authentication Utilities
 * Centralizes common auth logic for Next.js 15.4.3 App Router
 */

import { tokenClient } from '@/lib/services/token/client';

// Common error types for better type safety
export type AuthError = {
  type: 'validation' | 'authentication' | 'authorization' | 'network' | 'unknown';
  message: string;
  field?: string;
};

// Token extraction utility - consistent across the app
export const extractTokenFromHeaders = (headers: Record<string, string> | Headers): string | null => {
  const authHeader = headers instanceof Headers 
    ? headers.get('Authorization') || headers.get('authorization')
    : headers.Authorization || headers.authorization;
    
  if (!authHeader) return null;
  
  return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
};

// Centralized token processing
export const processAuthToken = (token: string) => {
  tokenClient.set(token);
  const decoded = tokenClient.decode(token);
  
  if (!decoded?.userId || !decoded?.email || !decoded?.roles) {
    throw new Error('Invalid token structure');
  }
  
  return {
    id: decoded.userId,
    email: decoded.email,
    name: decoded.name,
    imageUrl: decoded.imageUrl,
    roles: decoded.roles,
    tokenExpiry: decoded.exp
  };
};

// Error message extraction utility
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message;
  }
  return 'An unexpected error occurred';
};

// Social auth message types
export type SocialAuthMessage = {
  type: 'SOCIAL_LOGIN_SUCCESS' | 'SOCIAL_LOGIN_ERROR' | 'SOCIAL_LOGIN_ACCOUNT_ERROR';
  provider: string;
  user?: any;
  error?: string;
  message?: string;
  status?: number;
};

// Common validation patterns
export const validators = {
  isValidProvider: (provider: string): boolean => {
    return ['google', 'kakao', 'naver', 'apple'].includes(provider);
  },
  
  isValidOrigin: (origin: string): boolean => {
    return origin === window.location.origin;
  }
} as const;

// Popup management utilities
export const popupUtils = {
  openAuthPopup: (url: string, name: string = 'socialLogin') => {
    const width = 480;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    return window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  },
  
  watchPopupClose: (popup: Window | null, onClose: () => void) => {
    if (!popup) return;
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        onClose();
      }
    }, 1000);
    
    return checkClosed;
  }
} as const;