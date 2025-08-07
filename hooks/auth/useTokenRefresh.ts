/**
 * Token Auto-Refresh Hook
 * 
 * Automatically refreshes tokens based on:
 * 1. User activity detection
 * 2. Token expiry timing
 * 3. Tab visibility changes
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '@/stores/hook';
import { selectUser, selectIsAuthenticated } from '@/stores/slice/auth';
import { api } from '@/lib/fetch';
import { tokenClient } from '@/lib/services/token/client';
import { logger } from '@/lib/services/logger';
import { authConfig } from '@/constants/auth/client';

interface TokenRefreshOptions {
  // Activity detection settings
  enabled?: boolean;
  debounceTime?: number; // Time to wait after activity before refresh (ms)
  refreshBeforeExpiry?: number; // Time before expiry to trigger refresh (ms)
  activityEvents?: string[]; // Events to monitor for activity
  enableVisibilityRefresh?: boolean; // Refresh on tab focus
}

const DEFAULT_OPTIONS: Required<TokenRefreshOptions> = {
  enabled: true,
  debounceTime: 30 * 1000, // 30 seconds - more responsive to user activity
  refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes before expiry - safer margin
  activityEvents: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'],
  enableVisibilityRefresh: true,
};

export const useTokenRefresh = (options?: TokenRefreshOptions) => {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs for tracking state
  const lastActivityRef = useRef<number>(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(false);
  const tokenExpiryRef = useRef<number | undefined>(undefined);

  /**
   * Refresh the access token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      logger.info('Token refresh already in progress', 'AUTH');
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const { data, headers } = await api.post<any>('/api/auth/refresh', { 
        type: 'token' 
      });

      if (data?.success) {
        // Extract and store new access token
        const authHeader = headers?.Authorization || headers?.authorization;
        if (authHeader) {
          const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;
          
          tokenClient.set(token);
          
          // Calculate new expiry time (15 minutes from now)
          tokenExpiryRef.current = Date.now() + authConfig.security.accessToken;
          
          logger.info('Token refreshed successfully', 'AUTH');
          
          // Schedule next automatic refresh
          scheduleExpiryRefresh();
          
          return true;
        }
      }
      
      logger.warn('Token refresh failed - invalid response', 'AUTH');
      return false;
    } catch (error) {
      logger.error('Token refresh error', 'AUTH', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * Schedule a refresh before token expires
   */
  const scheduleExpiryRefresh = useCallback(() => {
    // Clear existing timer
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
    }

    if (!tokenExpiryRef.current) return;

    const now = Date.now();
    const timeUntilExpiry = tokenExpiryRef.current - now;
    const refreshTime = Math.max(0, timeUntilExpiry - config.refreshBeforeExpiry);

    if (refreshTime > 0) {
      logger.info(`Scheduling token refresh in ${refreshTime / 1000}s`, 'AUTH');
      
      expiryTimerRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    } else {
      // Token is about to expire or already expired
      refreshToken();
    }
  }, [config.refreshBeforeExpiry, refreshToken]);

  /**
   * Handle user activity
   */
  const handleActivity = useCallback(() => {
    if (!isAuthenticated || !config.enabled) return;

    const now = Date.now();
    
    // Clear existing refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Check if token is about to expire
    const timeUntilExpiry = tokenExpiryRef.current 
      ? tokenExpiryRef.current - now 
      : Infinity;

    if (timeUntilExpiry < config.refreshBeforeExpiry) {
      // Token is about to expire, refresh immediately
      logger.info('Token near expiry, refreshing immediately', 'AUTH');
      refreshToken();
    } else {
      // Schedule refresh after debounce period from current activity
      refreshTimerRef.current = setTimeout(() => {
        logger.info('Activity-based token refresh triggered', 'AUTH');
        refreshToken();
      }, config.debounceTime);
    }
    
    lastActivityRef.current = now;
  }, [isAuthenticated, config.enabled, config.debounceTime, config.refreshBeforeExpiry, refreshToken]);

  /**
   * Handle visibility change (tab focus/blur)
   */
  const handleVisibilityChange = useCallback(() => {
    if (!config.enableVisibilityRefresh || !isAuthenticated) return;

    if (!document.hidden) {
      // Tab became visible
      logger.info('Tab became visible, checking token', 'AUTH');
      
      const now = Date.now();
      const timeUntilExpiry = tokenExpiryRef.current 
        ? tokenExpiryRef.current - now 
        : Infinity;

      // Refresh if token is about to expire or if we've been away for a while
      if (timeUntilExpiry < config.refreshBeforeExpiry || 
          now - lastActivityRef.current > 10 * 60 * 1000) { // 10 minutes of inactivity
        refreshToken();
      }
    }
  }, [config.enableVisibilityRefresh, config.refreshBeforeExpiry, config.debounceTime, isAuthenticated, refreshToken]);

  /**
   * Handle online/offline events
   */
  const handleOnline = useCallback(() => {
    if (!isAuthenticated) return;
    
    logger.info('Network connection restored, refreshing token', 'AUTH');
    refreshToken();
  }, [isAuthenticated, refreshToken]);

  // Set up event listeners and timers
  useEffect(() => {
    if (!isAuthenticated || !config.enabled) return;

    // Initialize token expiry from user data
    if (user && 'tokenExpiry' in user && user.tokenExpiry) {
      tokenExpiryRef.current = user.tokenExpiry * 1000; // Convert to milliseconds
      scheduleExpiryRefresh();
    }

    // Add activity event listeners
    const activityHandler = () => handleActivity();
    config.activityEvents.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Add visibility change listener
    if (config.enableVisibilityRefresh) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Add online event listener
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      config.activityEvents.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
      
      if (config.enableVisibilityRefresh) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      window.removeEventListener('online', handleOnline);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [
    isAuthenticated, 
    user, 
    config.enabled, 
    config.activityEvents, 
    config.enableVisibilityRefresh,
    handleActivity, 
    handleVisibilityChange, 
    handleOnline,
    scheduleExpiryRefresh
  ]);

  return {
    refreshToken,
    lastActivity: lastActivityRef.current,
    isRefreshing: isRefreshingRef.current,
    nextRefresh: tokenExpiryRef.current
  };
};