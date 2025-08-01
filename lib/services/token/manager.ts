import { api } from '@/lib/fetch';
import { tokenClient } from './client';
import { TokenManager } from './types';
import { APIResult } from '@/types/api';

/**
 * 토큰 API 매니저 생성
 * 클라이언트에서 API 호출과 토큰 관리를 담당
 * @returns TokenManager 인스턴스
 */
export const createTokenManager = (): TokenManager => {
  return {
    /**
     * Access Token 가져오기
     * 토큰이 만료된 경우 null 반환하여 refresh 유도
     * @returns 유효한 access token 또는 null
     */
    getAccessToken: async (): Promise<string | null> => {
      const tokens = tokenClient.get();

      if (tokens.accessToken) {
        // 토큰이 만료되었는지 확인
        if (tokenClient.expired(tokens.accessToken)) {
          // 만료된 경우 null 반환하여 refresh 시도 유도
          return null;
        }
        return tokens.accessToken;
      }

      return null;
    },

    /**
     * Refresh Token으로 새로운 Access Token 가져오기
     * 쿠키의 refresh token을 사용하여 새로운 access token 발급
     * @returns 새로운 access token 또는 null
     */
    refreshAccessToken: async (): Promise<string | null> => {
      try {
        // 브라우저 환경에서만 실행
        if (typeof document === 'undefined') {
          return null;
        }

        // HttpOnly 쿠키이므로 클라이언트에서 refresh token을 직접 읽을 필요 없음.
        // 브라우저가 /api/auth/refresh 요청 시 자동으로 쿠키를 포함시켜 전송함.

        // 토큰 갱신 API 호출
        const { data, headers } = await api.post<APIResult>('/api/auth/refresh', { type: 'refresh' });

        if (!data.success) {
          tokenClient.clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return null;
        }

        // 새로운 Access Token을 헤더에서 가져오기 (대소문자 구분 없이)
        if (!headers) {
          return null;
        }

        const accessToken = (headers.authorization ?? headers.Authorization ?? '').replace(/^Bearer\s+/i, '');

        if (accessToken) {
          tokenClient.set(accessToken);
          return accessToken;
        }

        return null;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    }
  };
};

/**
 * 기본 토큰 매니저 인스턴스
 * 대부분의 경우 이 인스턴스를 사용
 */
export const tokenManager = createTokenManager();