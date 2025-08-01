"use client";
import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { setUser, clearUser } from '@/stores/slice/auth';
import { tokenClient } from '@/lib/services/token/client';
import { UserInfo } from '@/lib/server/auth';
import { useDispatch } from 'react-redux';
import { APIResult } from '@/types/api';
import { api } from '@/lib/fetch';
import { logger } from '@/lib/services/logger';

/**
 * Type definition for authentication data
 * Represents the resolved user information and tokens from server-side authentication
 */
type AuthData = Awaited<ReturnType<typeof UserInfo>>;

/**
 * React Context for sharing authentication data throughout the component tree
 * Provides user information, tokens, and session details to child components
 */
const AuthContext = createContext<AuthData>(null);

/**
 * Custom hook for consuming authentication context
 * @returns AuthData - Current authentication state including user info and tokens
 * @example
 * ```tsx
 * const authData = useAuthData();
 * if (authData?.user) {
 *   console.log('User is authenticated:', authData.user.email);
 * }
 * ```
 */
export const useAuthData = () => useContext(AuthContext);

/**
 * Props interface for Auth provider component
 */
interface AuthProps {
  /** Server-side authentication data passed from layout */
  readonly AuthData: AuthData;
  /** Child components that will have access to authentication context */
  readonly children: ReactNode;
}

/**
 * Auth Provider Component
 * 
 * Manages application-wide authentication state and token handling.
 * This component:
 * 1. Initializes Redux store with user data from server-side authentication
 * 2. Sets up client-side token management
 * 3. Handles token refresh to maintain session
 * 4. Provides authentication context to child components
 * 5. Implements cleanup on authentication failures
 * 
 * @component
 * @example
 * ```tsx
 * // In layout.tsx
 * const authData = await UserInfo();
 * 
 * return (
 *   <Auth AuthData={authData}>
 *     <App />
 *   </Auth>
 * );
 * ```
 * 
 * @param props - AuthProps containing server-side auth data and children
 * @returns JSX.Element - Provider component with authentication context
 */
export function Auth({ AuthData, children }: AuthProps) {
  const dispatch = useDispatch();
  const initialized = useRef(false);

  /**
   * Initialize authentication state on component mount
   * Handles user data setup, token management, and session refresh
   */
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initialized.current) return;

    /**
     * Async initialization function for authentication setup
     * Separated to handle complex async logic properly
     */
    const init = async () => {
      try {
        if (AuthData?.user) {
          // 1. Store user information in Redux store
          dispatch(setUser({
            id: AuthData.user.userId,
            email: AuthData.user.email,
            name: AuthData.user.name ?? undefined,
            imageUrl: AuthData.user.imageUrl ?? undefined,
            roles: AuthData.user.roles,
            tokenExpiry: AuthData.user.exp
          }));

          // 2. Set access token for API requests
          tokenClient.set(AuthData.accessToken);
          
          // 3. Refresh session to maintain authentication
          try {
            await api.post<APIResult>('/api/auth/refresh', { type: 'refresh' });
          } catch (refreshError) {
            logger.warn('Refresh failed, clearing auth', 'AUTH', refreshError);
            dispatch(clearUser());
            tokenClient.clear();
            // Force page reload to redirect to login
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }

        } else {
          // Clear authentication state when no user data
          dispatch(clearUser());
          tokenClient.clear();
        }
      } catch (err) {
        logger.error('Authentication initialization failed', 'AUTH', err);
        dispatch(clearUser());
        tokenClient.clear();
      } finally {
        initialized.current = true;
      }
    };
    void init();
  }, [AuthData, dispatch]);

  return (
    <AuthContext.Provider value={AuthData}>
      {children}
    </AuthContext.Provider>
  );
}