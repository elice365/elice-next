"use client";

import { store } from "@/stores";
import { Provider } from "react-redux";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from "react";

// PostHog 초기화는 한 번만 실행
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'always',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    }
  });
}

export function Redux({ children }: { readonly children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PostHogProvider client={posthog}>
        {children}
      </PostHogProvider>
    </Provider>
  );
}
