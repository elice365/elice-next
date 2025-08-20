import { cookies } from 'next/headers';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { tokenServer } from '@/lib/services/token/server';
import { logger } from '@/lib/services/logger';
import type { InitialAuthData } from '@/types/lib/server';
import { TokenPayload } from '@/lib/services/token/types';

// 개발 모드에서 Hot Reload로 인한 중복 호출 방지를 위한 메모리 캐시
let authCache: { 
  data: InitialAuthData | null; 
  timestamp: number; 
  token: string; 
} | null = null;

const CACHE_DURATION = 3000; // 3초 캐시 (개발 모드 최적화)

// 개발 모드에서 호출 횟수 추적
let callCount = 0;

// cache() 함수로 래핑하여 동일한 렌더링 사이클에서 중복 호출 방지
export const UserInfo = cache(async (): Promise<InitialAuthData | null> => {
  // 개발 모드에서 호출 횟수 추적
  if (process.env.NODE_ENV === 'development') {
    callCount++;
    logger.debug(`[AUTH] UserInfo called (${callCount})`, 'AUTH');
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('token')?.value;
  const fingerprint = cookieStore.get('fp')?.value;

  if (!refreshToken || !fingerprint) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[AUTH] No tokens found, returning null', 'AUTH');
    }
    return null;
  }

  // 개발 모드에서 캐시 확인 (Hot Reload 대응)
  if (process.env.NODE_ENV === 'development' && authCache) {
    const now = Date.now();
    const isTokenSame = authCache.token === refreshToken;
    const isCacheValid = (now - authCache.timestamp) < CACHE_DURATION;
    
    if (isTokenSame && isCacheValid) {
      logger.debug('[AUTH] Using cached user info', 'AUTH', {
        cacheAge: now - authCache.timestamp,
        tokenMatch: isTokenSame
      });
      return authCache.data;
    }
  }

  try {
    if (!tokenServer.verifyRefreshToken(refreshToken)) {
      return null;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',           
        'Cookie': `token=${refreshToken}; fp=${fingerprint}`,
      },
      body: JSON.stringify({ type: 'token' }), 
      cache: "no-store",
    });

    const data = await response.json();
    const headers = response.headers;

    if(!data){
      return null;
    }

    const accessToken =
      (headers.get("authorization") ?? headers.get("Authorization") ?? "").replace(
        /^Bearer\s+/i,
        ""
      );

    if (!accessToken) {
      return null;
    }

    const result = {
      user: tokenServer.verify(accessToken, 'access') as TokenPayload,
      accessToken: accessToken,
    };

    // 개발 모드에서 캐시 저장
    if (process.env.NODE_ENV === 'development') {
      authCache = {
        data: result,
        timestamp: Date.now(),
        token: refreshToken
      };
      logger.debug('[AUTH] Cached user info', 'AUTH', {
        userId: result.user?.userId,
        cacheTimestamp: authCache.timestamp
      });
    }

    return result;

  } catch (error) {
    logger.error("Error fetching user info", 'AUTH', error);
    
    // 에러 발생 시 캐시 무효화
    if (process.env.NODE_ENV === 'development') {
      authCache = null;
    }
    
    return null;
  }
});