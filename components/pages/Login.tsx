"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/hooks/useFingerprint';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AuthForm } from '@/components/features/auth/AuthForm';


export const LoginPage: React.FC = () => {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const { trackEvent, trackFormSubmit, trackError } = useAnalytics();
  
  // useAuth hook을 항상 호출
  const { login, isAuthenticated } = useAuth();

  // 로그인된 사용자가 로그인 페이지에 접속하면 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      trackEvent('login_page_redirect', {
        reason: 'already_authenticated',
        redirect_to: '/'
      });
      router.push('/');
    }
  }, [isAuthenticated, router, trackEvent]);

  const handleLogin = async (formData: any) => {
    try {
      // 로그인 시도 추적
      trackEvent('login_attempt', {
        method: 'email',
        has_fingerprint: !!fingerprint
      });
      
      // useAuth의 login 함수 사용 (Redux와 연동됨)
      await login({ ...formData, fingerprint });
      
      // 성공 시 폼 제출 추적 (실제 로그인 성공은 useAuth에서 추적됨)
      trackFormSubmit('login_form', true);
      
    } catch (error: any) {
      // 실패 시 추적
      trackFormSubmit('login_form', false, error.message);
      trackError('login_error', error.message, {
        form_data: { email: formData.email } // 비밀번호는 추적하지 않음
      });
      throw error; // 에러를 다시 던져서 폼에서 처리할 수 있게 함
    }
  };

  return (
    <AuthForm
      title="login"
      fields={[
        { name: 'email', type: 'email', label: 'Email', autoComplete: 'on' },
        { name: 'password', type: 'password', label: 'Password', autoComplete: 'on' },
      ]}
      onSubmit={handleLogin}
      successRedirect="/"
    />
  );
};
