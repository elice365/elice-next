import { jwtDecode } from 'jwt-decode';
import { TokenPayload, ClientTokens } from './types';

// 메모리 내 토큰 저장소 (성능 최적화)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let cookieCache: string | null = null;
let lastCookieCheck: number = 0;

// 쿠키 캐시 TTL (5초)
const COOKIE_CACHE_TTL = 5000;

/**
 * 클라이언트 전용 토큰 관리 서비스
 * 브라우저 환경에서만 실행되는 토큰 관리 기능
 */
export const tokenClient = {
  /**
   * Access Token 설정
   * @param token - 설정할 토큰 (Bearer 접두사 자동 제거)
   */
  set: (token: string): void => {
    // Bearer 접두사 제거
    accessToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    // Access Token은 메모리에만 저장
  },

  /**
   * Access Token 및 Refresh Token 가져오기 (캐싱 최적화)
   * Refresh Token은 쿠키에서 읽어오되 캐싱을 활용합니다.
   * @returns 현재 저장된 토큰들
   */
  get: (): ClientTokens => {
    if (typeof document !== 'undefined') {
      const now = Date.now();
      const currentCookie = document.cookie;
      
      // 쿠키가 변경되었거나 캐시가 만료된 경우에만 파싱
      if (
        cookieCache !== currentCookie || 
        now - lastCookieCheck > COOKIE_CACHE_TTL
      ) {
        cookieCache = currentCookie;
        lastCookieCheck = now;
        
        // 효율적인 쿠키 파싱
        refreshToken = tokenClient._parseCookie('token');
      }
    }
    
    return {
      accessToken,
      refreshToken,
    };
  },

  /**
   * 효율적인 쿠키 파싱 (내부 유틸리티)
   * @param cookieName - 파싱할 쿠키 이름
   * @returns 쿠키 값 또는 null
   */
  _parseCookie: (cookieName: string): string | null => {
    if (typeof document === 'undefined' || !cookieCache) return null;
    
    const name = cookieName + '=';
    const cookies = cookieCache.split(';');
    
    for (let cookie of cookies) {
     if (cookie.trim().startsWith(name)) {
        const value = cookie.substring(name.length);
        return value && value.trim() !== '' ? value : null;
      }
    }
    
    return null;
  },

  /**
   * 캐시 무효화 (쿠키 변경 시 강제 갱신)
   */
  invalidateCache: (): void => {
    cookieCache = null;
    lastCookieCheck = 0;
    refreshToken = null;
  },

  /**
   * 모든 토큰 삭제 (캐시 무효화 포함)
   */
  clear: (): void => {
    // 메모리에서 모든 토큰 삭제
    accessToken = null;
    refreshToken = null;
    
    // 캐시 무효화
    tokenClient.invalidateCache();
    
    // 쿠키에서 refresh token 삭제
    if (typeof document !== 'undefined') {
      try {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      } catch (error) {
        console.error('Failed to clear refresh token cookie:', error);
      }
    }
  },

  /**
   * 토큰 내용 디코딩 (서명 검증 없음)
   * @param tokenValue - 디코딩할 토큰
   * @returns 디코딩된 페이로드 또는 null
   */
  decode: (tokenValue: string): TokenPayload | null => {
    try {
      return jwtDecode<TokenPayload>(tokenValue);
    } catch (error) {
      console.error("Invalid token specified:", error);
      return null;
    }
  },

  /**
   * 토큰 만료 여부 확인
   * @param tokenValue - 확인할 토큰
   * @returns 만료 여부 (true: 만료됨)
   */
  expired: (tokenValue: string): boolean => {
    const decoded = tokenClient.decode(tokenValue);
    
    // 디코딩 실패했거나 만료 정보가 없으면 만료된 것으로 처리
    if (!decoded || typeof decoded.exp === 'undefined') {
      return true;
    }
    
    // 현재 시간이 만료 시간보다 크면 true 반환
    return Date.now() >= decoded.exp * 1000;
  },

  /**
   * 토큰 유효성 검사 (만료 + 형식)
   * @param tokenValue - 검사할 토큰
   * @returns 유효성 여부
   */
  validate: (tokenValue: string): boolean => {
    if (!tokenValue) return false;
    
    try {
      const decoded = tokenClient.decode(tokenValue);
      return decoded !== null && !tokenClient.expired(tokenValue);
    } catch {
      return false;
    }
  }
};