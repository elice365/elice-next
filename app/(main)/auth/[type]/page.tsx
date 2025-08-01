'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/fetch';
import { authConfig } from '@/constants/auth/client';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage, processAuthToken, extractTokenFromHeaders } from '@/lib/auth/utils';

// 지원되는 소셜 제공자 타입
type SocialProvider = 'google' | 'kakao' | 'naver' | 'apple';

const UnifiedAuthPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { social } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const type = params?.type as string;

  // URL 파라미터들
  const provider = (searchParams.get('provider') || type) as SocialProvider;
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');


  useEffect(() => {
    // 중복 실행 방지를 위한 즉시 체크
    const globalKey = `auth_processing_${type}_${code}`;

    // 이미 처리 중이거나 완료된 경우 즉시 리턴
    if (sessionStorage.getItem(globalKey) === 'processing') {
      return;
    }

    if (sessionStorage.getItem(`auth_completed_${type}_${code}`)) {
      router.push('/');
      return;
    }

    // 처리 시작 마킹
    sessionStorage.setItem(globalKey, 'processing');

    const processAuth = async () => {
      try {
        switch (type) {
          case 'verify':
            return await emailVerification();
          case 'callback':
            return await callback();
          case 'google':
          case 'kakao':
          case 'naver':
          case 'apple':
            return await handleSocialAuth(type);
          default:
            setStatus('error');
            setMessage('잘못된 인증 경로입니다.');
            setTimeout(() => router.push('/'), 3000);
        }
      } finally {
        // 처리 완료 후 플래그 제거
        sessionStorage.removeItem(globalKey);
      }
    };

    const callback = async () => {
      // 소셜 로그인 콜백 처리
      if (provider && code) {
        return await handleSocialAuth(provider);
      }

      // 이메일 인증 콜백 처리
      if (token) {
        return await emailVerification();
      }

      // 잘못된 접근
      setStatus('error');
      setMessage('잘못된 접근입니다.');
      setTimeout(() => router.push('/'), 3000);
    };

    const handleSocialAuth = async (socialProvider: SocialProvider) => {
      // 강화된 중복 방지 로직
      const completedKey = `auth_completed_${socialProvider}_${code}`;

      if (sessionStorage.getItem(completedKey)) {
        router.push('/');
        return;
      }

      if (error) {
        setStatus('error');
        setMessage(`소셜 로그인 에러: ${error}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('인증 코드가 없습니다.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!authConfig.socialType.includes(socialProvider)) {
        setStatus('error');
        setMessage(`지원하지 않는 제공자: ${socialProvider}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        const result = await social({ type: socialProvider, code });

        // 성공 시 완료 플래그 설정 (중복 방지)
        sessionStorage.setItem(completedKey, 'true');

        setStatus('success');
        setMessage('소셜 로그인이 완료되었습니다.');

        // 팝업인 경우 부모 창에 결과 전달
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_LOGIN_SUCCESS',
            provider: socialProvider,
            user: result
          }, window.location.origin);
          window.close();
        } else {
          setTimeout(() => router.push('/'), 1000);
        }
      } catch (error: unknown) {
        // Use shared error extraction utility
        const errorMessage = extractErrorMessage(error) || 'Social login failed: Unknown error.';

        setStatus('error');
        setMessage(errorMessage);

        // 팝업인 경우 부모 창에 에러 전달
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_LOGIN_ERROR',
            provider: socialProvider,
            error: errorMessage
          }, window.location.origin);
          setTimeout(() => window.close(), 2000);
        } else {
          setTimeout(() => router.push('/'), 3000);
        }
      }
    };

    const emailVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('인증 토큰이 없습니다.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        const { data, headers } = await api.post<{
          success: boolean;
          message: string;
          data?: any;
        }>('/api/auth/verify', { token });

        if (data.success) {
          setStatus('success');
          setMessage('이메일 인증이 완료되었습니다.');

          // Use shared token processing utilities
          const accessToken = extractTokenFromHeaders(headers || {});

          if (accessToken) {
            try {
              processAuthToken(accessToken);
            } catch (tokenError) {
              console.warn('Token processing failed during email verification:', tokenError);
            }
          }

          setTimeout(() => router.push('/'), 2000);
        } else {
          setStatus('error');
          setMessage(data.message || '인증에 실패했습니다.');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error: unknown) {
        setStatus('error');
        // Use shared error extraction utility with fallback
        const errorMessage = extractErrorMessage(error) || '인증 처리 중 오류가 발생했습니다.';
        setMessage(errorMessage);
        setTimeout(() => router.push('/'), 3000);
      }
    };

    processAuth();
  }, [type, provider, code, token, error, state, router, social]);

  const getTitle = () => {
    if (type === 'verify' || token) return '이메일 인증';
    if (provider || ['google', 'kakao', 'naver', 'apple'].includes(type)) {
      const displayProvider = provider || type;
      const providerNames: Record<string, string> = {
        google: 'Google',
        kakao: 'Kakao',
        naver: 'Naver',
        apple: 'Apple'
      };
      return `${providerNames[displayProvider] || displayProvider} 로그인`;
    }
    return '인증 처리';
  };

  const getLoadingMessage = () => {
    if (type === 'verify' || token) return '이메일 인증을 처리하고 있습니다...';
    if (provider || ['google', 'kakao', 'naver', 'apple'].includes(type)) {
      return '소셜 로그인 처리 중입니다...';
    }
    return '처리 중입니다...';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 bg-modal rounded-lg shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h2 className="text-xl font-semibold text-color mb-2">{getTitle()}</h2>
            <p className="text-color/70 mb-6">{getLoadingMessage()}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-color mb-2">완료!</h3>
            <p className="text-color/70 mb-4">{message}</p>
            <p className="text-sm text-color/50">메인 페이지로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-color mb-2">오류 발생</h3>
            <p className="text-color/70 mb-4">{message}</p>
            <div className="space-y-2">
              {(type === 'verify' || token) && (
                <>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
                  >
                    다시 회원가입하기
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-[var(--border-color)] text-sm font-medium rounded-md text-color bg-background hover:bg-gray-50 transition-colors"
                  >
                    로그인 페이지로 이동
                  </button>
                </>
              )}
              {!((type === 'verify' || token)) && (
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
                >
                  메인으로 돌아가기
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthPage;