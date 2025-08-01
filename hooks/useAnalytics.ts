"use client";
import { usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * 사용자 행동 추적을 위한 커스텀 훅
 * PostHog를 이용한 이벤트 추적 및 페이지 뷰 추적
 */
export const useAnalytics = () => {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // 페이지 뷰 자동 추적
  useEffect(() => {
    if (pathname) {
      const searchQuery = searchParams.toString();
      const url = pathname + (searchQuery ? '?' + searchQuery : '');
      
      posthog.capture('$pageview', {
        $current_url: url,
        page_path: pathname,
        user_authenticated: isAuthenticated,
        user_id: user?.id || 'anonymous'
      });
    }
  }, [pathname, searchParams, posthog, isAuthenticated, user?.id]);

  // 커스텀 이벤트 추적 함수들
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, {
      ...properties,
      user_id: user?.id || 'anonymous',
      user_authenticated: isAuthenticated,
      timestamp: new Date().toISOString()
    });
  }, [posthog, user?.id, isAuthenticated]);

  // 버튼 클릭 추적
  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      location: location || pathname,
      action_type: 'click'
    });
  }, [trackEvent, pathname]);

  // 폼 제출 추적
  const trackFormSubmit = useCallback((formName: string, success: boolean, errorMessage?: string) => {
    trackEvent('form_submitted', {
      form_name: formName,
      success,
      error_message: errorMessage,
      location: pathname
    });
  }, [trackEvent, pathname]);

  // 검색 추적
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    trackEvent('search_performed', {
      search_query: query,
      results_count: resultsCount,
      location: pathname
    });
  }, [trackEvent, pathname]);

  // 에러 추적
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      location: pathname,
      ...context
    });
  }, [trackEvent, pathname]);

  // 기능 사용 추적
  const trackFeatureUsage = useCallback((featureName: string, action: string, metadata?: Record<string, any>) => {
    trackEvent('feature_used', {
      feature_name: featureName,
      action,
      location: pathname,
      ...metadata
    });
  }, [trackEvent, pathname]);

  // 사용자 프로필 업데이트
  const updateUserProfile = useCallback((properties: Record<string, any>) => {
    if (user?.id) {
      posthog.setPersonProperties(properties);
    }
  }, [posthog, user?.id]);

  return {
    // 이벤트 추적
    trackEvent,
    trackButtonClick,
    trackFormSubmit,
    trackSearch,
    trackError,
    trackFeatureUsage,
    
    // 사용자 프로필
    updateUserProfile,
    
    // PostHog 인스턴스 (고급 사용)
    posthog
  };
};