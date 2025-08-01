import { APIResult } from '@/types/api';
import { NextRequest } from 'next/server';
import { Message, setMessage, setRequest } from '@/lib/response';
import { authConfig } from '@/constants/auth/client';
import { authServerConfig } from '@/constants/auth/server';
import { requestInfo } from '@/lib/server/info';
import { processSocial } from '@/lib/services/social/login';
import {
  SocialProvider,
  SocialAuthRequest,
} from '@/types/social';
import { socialTypeCheck } from '@/utils/type/social';

/**
 * 에러 메시지에 따른 HTTP 상태 코드 반환
 */
function getStatusCodeForMessage(message: string): number {
  switch (message) {
    case 'AccountSuspended':
    case 'AccountInactive':
      return 403;
    case 'InvalidField':
    case 'AuthError':
      return 400;
    case 'UnknownError':
      return 500;
    default:
      return 500;
  }
}

/**
 * 소셜 로그인 인증 URL 생성
 */
export const socialLogin = async (request: NextRequest): Promise<APIResult> => {
  try {
    const body: SocialAuthRequest = await request.json();
    const { type, fingerprint } = body;

    // 프로바이더 유효성 검증
    if (!type || !socialTypeCheck(type)) {
      return await setMessage('InvalidField', null, 400);
    }

    if (!authConfig.socialType.includes(type)) {
      return await setMessage('InvalidField', null, 400);
    }

    // 프로바이더 설정 가져오기 (서버 전용)
    const socialConfig = authServerConfig.social[type as keyof typeof authServerConfig.social];

    if (!socialConfig) {
      return await setMessage('InvalidField', null, 400);
    }

    // OAuth URL 생성
    const authUrl = generateOAuthUrl(type, socialConfig);

    return setRequest({ authUrl, fingerprint });

  } catch (error) {

    if (error instanceof SyntaxError) {
      console.error("Syntax Error in socialLogin:", error);
      return await setMessage('InvalidField', null, 400);
    }

    console.error("Unknown Error in socialLogin:", error);
    return await setMessage('UnknownError', null, 500);
  }
};

/**
 * OAuth URL 생성 헬퍼 함수
 */
function generateOAuthUrl(provider: SocialProvider, config: any): string {
  const state = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const baseParams = new URLSearchParams({
    client_id: config.appID,
    redirect_uri: config.redirect,
    response_type: 'code',
    state
  });

  // 프로바이더별 추가 파라미터
  switch (provider) {
    case 'google':
      baseParams.append('scope', 'openid email profile');
      baseParams.append('access_type', 'offline');
      break;

    case 'kakao':
      baseParams.append('scope', 'profile_nickname,profile_image,account_email');
      break;

    case 'naver':
      baseParams.append('scope', 'name,email,profile_image');
      break;

    case 'apple':
      baseParams.append('scope', 'name email');
      baseParams.append('response_mode', 'form_post');
      break;
  }

  return `${config.auth}?${baseParams.toString()}`;
}

/**
 * 소셜 로그인 콜백 처리 (완전 구현)
 */
export const social = async (request: NextRequest): Promise<APIResult> => {
  try {
    const { searchParams, pathname } = new URL(request.url);

    // URL에서 프로바이더 추출 (예: /api/auth/google)
    const path = pathname.split('/');
    const fromPath = path[path.length - 1] as SocialProvider;

    // 요청 파라미터 추출
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 에러 응답 처리
    if (error) {
      console.error(`[${[fromPath]}] OAuth error:`, error, errorDescription);
      return await setMessage('AuthError', null, 400);
    }

    // 필수 파라미터 검증
    if (!code) {
      return await setMessage('InvalidField', null, 400);
    }

    if (!socialTypeCheck(fromPath)) {
      return await setMessage('InvalidField', null, 400);
    }

    // 클라이언트 정보 수집
    const clientInfo = requestInfo(request);

    // 쿠키에서 fingerprint 가져오기
    const fingerprint = request.cookies.get('fp')?.value;

    // 소셜 로그인 처리
    const login = await processSocial({
      provider: fromPath,
      code,
      clientInfo,
      fingerprint
    });

    if (!login.success) {
      // processSocial에서 반환된 에러 메시지를 바탕으로 적절한 상태 코드 설정
      const statusCode = getStatusCodeForMessage(login.message!);
      return await setMessage(login.message as Message, null, statusCode);
    }

    // 성공 응답 (일반 로그인과 동일한 구조로 변경)
    return await setMessage('loginSuccess', {
      user: login.user,
      token: login.tokens.accessToken,
      refreshToken: login.tokens.refreshToken,
      sessionId: login.session.sessionId,
      fingerprint: fingerprint
    }, 200);

  } catch (error) {

    if (error instanceof SyntaxError) {
      console.error("Syntax Error in social callback:", error);
      return await setMessage('InvalidField', null, 400);
    }

    // 소셜 에러인 경우 더 구체적인 메시지
    if (error && typeof error === 'object' && 'provider' in error) {
      console.error("Social Error in social callback:", error);
      return await setMessage('AuthError', null, 500);
    }

    console.error("Unknown Error in social callback:", error);
    return await setMessage('UnknownError', null, 500);
  }
};

/**
 * 소셜 계정 연결 해제
 */
export const socialUnlink = async (request: NextRequest): Promise<APIResult> => {
  try {
    const { provider, userId } = await request.json();

    if (!socialTypeCheck(provider)) {
      return await setMessage('InvalidField', null, 400);
    }

    if (!userId) {
      return await setMessage('InvalidField', null, 400);
    }

    return await setMessage('loginSuccess', null, 200);

  } catch (error) {
    console.error("Error unlinking social account:", error);
    return await setMessage('UnknownError', null, 500);
  }
};

/**
 * 소셜 프로바이더 상태 확인
 */
export const socialStatus = async (request: NextRequest): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as SocialProvider;

    if (!provider || !socialTypeCheck(provider)) {
      return await setMessage('InvalidField', null, 400);
    }

    const isConfigured = authConfig.socialType.includes(provider);
    const config = authServerConfig.social[provider as keyof typeof authServerConfig.social];

    return await setMessage('loginSuccess', {
      provider,
      configured: isConfigured,
      available: !!(config?.appID && config?.auth && config?.redirect)
    }, 200);

  } catch (error) {
    console.error("Error checking social status:", error);
    return await setMessage('UnknownError', null, 500);
  }
};

// 기존 OAuthTokenResponse 인터페이스는 types/social.ts로 이동 (재사용성)