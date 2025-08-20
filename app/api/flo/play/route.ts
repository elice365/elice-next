// FLO 재생 API 라우터

import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { getFloSession, upsertFloSession, updateLatestVersion, isSessionExpired, isSessionExpiringSoon } from '@/lib/db/flo';
import { FloAuthClient } from '@/lib/flo';
import { FloAuthClient as AutoLoginClient } from '@/lib/flo/login';
import { FLO_ERRORS } from '@/constants/flo/play';
import type { FloPlayRequest, FloPlayResponse } from '@/types/flo/play';
import type { APIResult } from '@/types/api/api';

const handlePost = async (request: NextRequest): Promise<APIResult<FloPlayResponse>> => {
  // 요청 데이터 파싱
  const body: FloPlayRequest = await request.json();
  const { resource } = body;

  if (!resource) {
    return {
      success: false,
      message: FLO_ERRORS.INVALID_RESOURCE
    };
  }

  // FLO 클라이언트 초기화
  const floClient = new FloAuthClient();

  // Helper: ensure we have a valid session (auto-login if needed)
  const ensureSession = async () => {
    let s = await getFloSession();
    if (s && !isSessionExpired(s)) return s;
    console.log('🔄 세션이 없거나 만료됨, 자동 로그인 시도 중...');
    const autoLoginClient = new AutoLoginClient();
    const loginResult = await autoLoginClient.autoLogin();
    if (!loginResult.success) {
      throw new Error(`FLO 자동 로그인 실패: ${loginResult.error}`);
    }
    s = await getFloSession();
    if (!s) {
      throw new Error('FLO 로그인 후 세션 생성 실패');
    }
    return s;
  };

  let session = await ensureSession();

  // 2. 앱 버전 확인 및 최신 버전 업데이트
  console.log('📱 Checking FLO app version...');
  const versionResult = await floClient.checkAppVersion();
  
  if (versionResult.success && versionResult.data) {
    // latestVersion만 업데이트 (appVersion은 업데이트 금지)
    await updateLatestVersion(versionResult.data.version);
    console.log(`✅ Latest version updated: ${versionResult.data.version}`);
  } else {
    console.warn('⚠️ Version check failed:', versionResult.error);
  }

  // 3-4. 토큰 만료/유효성 검사 및 필요 시 재로그인
  const validateOrRelogin = async () => {
    if (isSessionExpired(session)) {
      throw new Error(FLO_ERRORS.TOKEN_EXPIRED);
    }
    console.log('🔐 Validating FLO token...');
    const tokenValidation = await floClient.validateToken(session.accessToken);
    if (tokenValidation.success && tokenValidation.valid) {
      // 최신 토큰 저장
      if (tokenValidation.accessToken && tokenValidation.accessToken !== session.accessToken) {
        const expiresAt = tokenValidation.expiresAt
          ? new Date(tokenValidation.expiresAt)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);
        await upsertFloSession({
          appVersion: session.appVersion,
          latestVersion: session.latestVersion,
          accessToken: tokenValidation.accessToken,
          refreshToken: tokenValidation.refreshToken,
          expiresAt
        });
      }
      return tokenValidation;
    }
    console.log('❌ Token validation failed, attempting re-login...');
    const autoLoginClient = new AutoLoginClient();
    const loginResult = await autoLoginClient.autoLogin();
    if (!loginResult.success) {
      throw new Error(`FLO 재로그인 실패: ${loginResult.error}`);
    }
    const newSession = await getFloSession();
    if (!newSession) {
      throw new Error('FLO 재로그인 후 세션 생성 실패');
    }
    session = newSession;
    return null;
  };

  await validateOrRelogin();

  // 6. 스트림 URL 가져오기
  console.log(`🎵 Getting stream URL for resource: ${resource}`);
  
  // auto-login 클라이언트를 사용해서 스트림 URL 가져오기
  const autoLoginClient = new AutoLoginClient();
  const streamResult = await autoLoginClient.getMusicStreamUrl(resource);
  if (!streamResult.success || !streamResult.streamUrl) {
    return {
      success: false,
      message: streamResult.error || FLO_ERRORS.STREAM_UNAVAILABLE
    };
  }
  
  return {
    success: true,
    data: {
      success: true,
      streamUrl: streamResult.streamUrl,
      data: {
        url: streamResult.streamUrl,
        bitrate: streamResult.data?.bitrate || 'aac',
        duration: 0,
        format: streamResult.data?.url?.endsWith('.m4a') ? 'm4a' : 'mp3'
      }
    }
  };
};

export const POST = handler<FloPlayResponse>(handlePost, { auth: false });

const handleGet = async (): Promise<APIResult<any>> => {
  const session = await getFloSession();
  
  if (!session) {
    return {
      success: true,
      data: {
        authenticated: false,
        error: FLO_ERRORS.NOT_AUTHENTICATED
      }
    };
  }

  const floClient = new FloAuthClient();
  const tokenInfo = floClient.decodeJWT(session.accessToken);

  return {
    success: true,
    data: {
      authenticated: true,
      session: {
        appVersion: session.appVersion,
        latestVersion: session.latestVersion,
        expiresAt: session.expiresAt,
        isExpired: isSessionExpired(session),
        isExpiringSoon: isSessionExpiringSoon(session)
      },
      tokenInfo: {
        expiresAt: tokenInfo.expiresAt,
        remainingTime: tokenInfo.remainingTime,
        isValid: tokenInfo.isValid
      }
    }
  };
};

export const GET = handler(handleGet, { auth: false });
