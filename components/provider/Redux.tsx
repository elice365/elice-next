"use client";

import { store } from "@/stores";
import { Provider } from "react-redux";
import { useEffect } from "react";

// PostHog를 동적으로 로드하는 컴포넌트
function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initPostHog = async () => {
      if (typeof window === 'undefined') return;
      
      // 개발 환경에서는 PostHog를 완전히 비활성화
      if (process.env.NODE_ENV === 'development') {
        console.log('PostHog disabled in development mode');
        return;
      }
      
      const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (!postHogKey) return;

      try {
        const { default: posthog } = await import('posthog-js');
        
        if (!posthog.__loaded) {
          posthog.init(postHogKey, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
            capture_pageview: true,
            capture_pageleave: true,
            persistence: 'localStorage',
            cross_subdomain_cookie: false,
            disable_session_recording: true,
            // 원격 설정 비활성화
            advanced_disable_decide: true,
          });
        }
      } catch (error) {
        console.warn('PostHog initialization failed:', error);
      }
    };

    initPostHog();
  }, []);

  return <>{children}</>;
}

export function Redux({ children }: { readonly children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </Provider>
  );
}
