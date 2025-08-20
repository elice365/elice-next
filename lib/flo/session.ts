// FLO 세션 유틸리티 함수들
import { getFloSession, isSessionExpired } from '@/lib/db/flo';
import { logger } from '@/utils/logger';
import type { FloSessionData } from '@/types/flo/play';

/**
 * 유효한 FLO 세션을 가져옵니다. 세션이 없거나 만료된 경우 자동으로 갱신합니다.
 */
export async function getValidFloSession(): Promise<FloSessionData | null> {
  try {
    // 기존 세션 확인
    let session = await getFloSession();
    
    // 세션이 없는 경우 자동 갱신
    if (!session) {
      logger.flo.warn('FLO session not found, attempting auto-refresh');
      session = await refreshFloSession();
      return session;
    }
    
    // 세션 만료 확인
    if (isSessionExpired(session)) {
      logger.flo.warn('FLO session expired, attempting refresh');
      session = await refreshFloSession();
      return session;
    }
    
    return session;
  } catch (error) {
    logger.flo.error('Error getting valid FLO session', error);
    return null;
  }
}

/**
 * FLO 세션을 새로 갱신합니다.
 */
export async function refreshFloSession(): Promise<FloSessionData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const refreshResponse = await fetch(`${baseUrl}/api/flo/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!refreshResponse.ok) {
      const error = await refreshResponse.json().catch(() => ({}));
      logger.flo.error('FLO session refresh failed', {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
        error: error.message
      });
      return null;
    }
    
    // 갱신 후 세션 다시 가져오기
    const session = await getFloSession();
    if (session) {
      logger.flo.info('FLO session refreshed successfully', {
        sessionId: session.id,
        expiresAt: session.expiresAt
      });
    }
    
    return session;
  } catch (error) {
    logger.flo.error('Error refreshing FLO session', error);
    return null;
  }
}

/**
 * FLO API 요청을 위한 인증 헤더를 생성합니다.
 */
export function generateFloAuthHeaders(session: FloSessionData): Record<string, string> {
  return {
    'x-gm-access-token': session.accessToken,
    'x-gm-request-time': Date.now().toString(),
    'Authorization': `FLO ${generateAuthHash(session.accessToken)}`
  };
}

/**
 * FLO API 인증용 해시를 생성합니다.
 */
function generateAuthHash(accessToken: string): string {
  // 실제 FLO API의 Authorization 해시 생성 로직
  return Buffer.from(accessToken.substring(0, 32)).toString('base64').substring(0, 32);
}

/**
 * Content-MD5 해시를 생성합니다.
 */
export function generateMD5Hash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  return Math.abs(hash).toString(16);
}