// FLO 데이터베이스 조작 함수들

import { prisma } from '@/lib/db';
import type { FloSessionData } from '@/types/flo/play';

/**
 * FLO 세션 조회
 */
export async function getFloSession(): Promise<FloSessionData | null> {
  try {
    const session = await prisma.floSession.findFirst({
      orderBy: { updatedTime: 'desc' }
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      appVersion: session.appVersion,
      latestVersion: session.latestVersion,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || undefined,
      savedAt: session.savedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString()
    };
  } catch (error) {
    console.error('Failed to get FLO session:', error);
    return null;
  }
}

/**
 * FLO 세션 생성 또는 업데이트
 */
export async function upsertFloSession(sessionData: {
  appVersion: string;
  latestVersion: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}): Promise<FloSessionData | null> {
  try {
    const session = await prisma.floSession.upsert({
      where: { id: 'flo-session-1' }, // 단일 세션 관리
      create: {
        id: 'flo-session-1',
        appVersion: sessionData.appVersion,
        latestVersion: sessionData.latestVersion,
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        savedAt: new Date(),
        expiresAt: sessionData.expiresAt
      },
      update: {
        latestVersion: sessionData.latestVersion,
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        savedAt: new Date(),
        expiresAt: sessionData.expiresAt,
        updatedTime: new Date()
      }
    });

    return {
      id: session.id,
      appVersion: session.appVersion,
      latestVersion: session.latestVersion,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || undefined,
      savedAt: session.savedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString()
    };
  } catch (error) {
    console.error('Failed to upsert FLO session:', error);
    return null;
  }
}

/**
 * 최신 버전 업데이트 (appVersion은 업데이트 금지)
 */
export async function updateLatestVersion(latestVersion: string): Promise<boolean> {
  try {
    await prisma.floSession.updateMany({
      data: {
        latestVersion,
        updatedTime: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to update latest version:', error);
    return false;
  }
}

/**
 * 토큰 업데이트
 */
export async function updateFloTokens(
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await prisma.floSession.updateMany({
      data: {
        accessToken,
        ...(refreshToken && { refreshToken }),
        ...(expiresAt && { expiresAt }),
        savedAt: new Date(),
        updatedTime: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to update FLO tokens:', error);
    return false;
  }
}

/**
 * 세션 삭제
 */
export async function deleteFloSession(): Promise<boolean> {
  try {
    await prisma.floSession.deleteMany({});
    return true;
  } catch (error) {
    console.error('Failed to delete FLO session:', error);
    return false;
  }
}

/**
 * 세션 만료 확인
 */
export function isSessionExpired(session: FloSessionData): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  return now >= expiresAt;
}

/**
 * 세션 만료 임박 확인 (30분 전)
 */
export function isSessionExpiringSoon(session: FloSessionData): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const threshold = 30 * 60 * 1000; // 30분
  
  return (expiresAt.getTime() - now.getTime()) < threshold;
}