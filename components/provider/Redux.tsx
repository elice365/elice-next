"use client";

import { store } from "@/stores";
import { Provider } from "react-redux";
import { usePostHog, PostHogProvider } from 'posthog-js/react'
import { useEffect } from "react";

export function Redux({ children }: { readonly children: React.ReactNode }) {
  // webdriver 검사 제거 - hook 에러 방지를 위해
  const posthog = usePostHog()
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'always',
      defaults: '2025-05-24'
    })
  }, [])

  return (
    <Provider store={store}>
      <PostHogProvider client={posthog}>
        {children}
      </PostHogProvider>
    </Provider>
  );
}
