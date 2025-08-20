import { APIResult } from "@/types/api";
import { NextRequest } from "next/server";
import { tokenServer } from "../services/token/server";
import { searchSession, searchSessionId, updateSession } from "@/lib/db/session";
import { setMessage } from "../response";
import { requestIP } from "../server/info";
import { logger } from "@/lib/services/logger";
import type { TokenValidationResult, RefreshTokens } from "@/types/lib/token";

// Validation functions to reduce complexity
async function validateRequest(request: NextRequest): Promise<APIResult | null> {
  if (request.method !== 'POST') {
    return await setMessage('InvalidType', null, 405);
  }
  return null;
}

async function validateType(type: string): Promise<APIResult | null> {
  if (!["refresh", "token"].includes(type)) {
    return await setMessage('InvalidType', null, 405);
  }
  return null;
}

function extractTokens(request: NextRequest): RefreshTokens {
  return {
    refreshToken: request.cookies.get('token')?.value,
    fingerprint: request.cookies.get('fp')?.value
  };
}

async function validateTokens(tokens: RefreshTokens): Promise<APIResult | null> {
  if (!tokens.refreshToken || !tokens.fingerprint) {
    return await setMessage('TokenDenied', null, 401);
  }
  return null;
}

async function validateToken(refreshToken: string, fingerprint: string): Promise<TokenValidationResult | APIResult> {
  try {
    const refreshTokenResult = tokenServer.verifyRefreshToken(refreshToken);

    if (!refreshTokenResult) {
      logger.warn('[REFRESH] Invalid refresh token structure', 'AUTH');
      return await setMessage('InvalidToken', null, 401);
    }

    const {
      sessionId: refreshsessionId,
      userId: refreshUserId,
      fingerprint: refreshfp
    } = refreshTokenResult;

    if (!refreshsessionId) {
      logger.warn('[REFRESH] Missing sessionId in refresh token', 'AUTH');
      return await setMessage('InvalidToken', null, 401);
    }

    if (refreshfp !== fingerprint) {
      logger.warn('[REFRESH] Fingerprint mismatch', 'AUTH', { expected: refreshfp, received: fingerprint });
      return await setMessage('InvalidToken', null, 401);
    }

    return {
      sessionId: refreshsessionId,
      userId: refreshUserId,
      fingerprint: refreshfp
    };
  } catch (error) {
    logger.error('[REFRESH] Token validation error', 'AUTH', error);
    return await setMessage('InvalidToken', null, 401);
  }
}

async function refreshToken(
  request: NextRequest,
  tokenValidation: TokenValidationResult
): Promise<APIResult> {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return await setMessage('InvalidType', null, 401);
  }

  const accessTokenResult = tokenServer.verify(auth.slice(7), 'access');
  if ('type' in accessTokenResult && accessTokenResult.type === 'denied') {
    return await setMessage('InvalidToken', null, 401);
  }

  const { fingerprint: accessfp, userId: accessUserId, sessionId: accesssessionId } = accessTokenResult;

  // Validate token consistency
  if (accessfp !== tokenValidation.fingerprint || accesssessionId !== tokenValidation.sessionId) {
    if (accesssessionId) {
      await updateSession(accesssessionId, { active: false });
    }
    return await setMessage('TokenDenied', null, 401);
  }

  const session = await searchSessionId(accesssessionId, accessUserId);
  if (!session) {
    return await setMessage('TokenExpired', null, 401);
  }

  // IP validation
  const ipValidationResult = await validateIP(request, session);
  if (ipValidationResult) {
    return ipValidationResult;
  }

  return await setMessage('loginSuccess', {
    refreshToken: session?.refreshToken
  }, 200);
}

async function validateIP(request: NextRequest, session: any): Promise<APIResult | null> {
  const currentIP = await requestIP(request);

  // IP 변경 시 경고 로그만 남기고 세션 유지 (보안과 사용성의 균형)
  if (session.active && session.ipAddress && session.ipAddress !== currentIP) {
    logger.warn('[REFRESH] IP address changed', 'AUTH', {
      sessionId: session.sessionId,
      oldIP: session.ipAddress?.substring(0, 8) + '***',
      newIP: currentIP?.substring(0, 8) + '***'
    });

    // IP 주소 업데이트 (세션 무효화하지 않음)
    await updateSession(session.sessionId, {
      ipAddress: currentIP,
      updateTime: new Date()
    });
  }

  return null;
}

async function tokenGen(
  tokenValidation: TokenValidationResult,
  fingerprint: string,
  refreshToken: string
): Promise<APIResult> {
  try {
    logger.debug('[REFRESH] tokenGen - Searching session', 'AUTH', {
      userId: tokenValidation.userId,
      sessionId: tokenValidation.sessionId,
      hasRefreshToken: !!refreshToken
    });

    const session = await searchSession(refreshToken, tokenValidation.userId);

    if (!session) {
      logger.error('[REFRESH] No session found', 'AUTH', {
        userId: tokenValidation.userId,
        refreshTokenPrefix: refreshToken?.substring(0, 20) || 'undefined'
      });
      return await setMessage('TokenExpired', null, 401);
    }

    // Check if session is still active
    if (!session.active) {
      logger.warn('[REFRESH] Session is not active', 'AUTH', { sessionId: session.sessionId });
      return await setMessage('TokenExpired', null, 401);
    }

    // Check if session is expired
    if (new Date(session.expiresTime) < new Date()) {
      logger.warn('[REFRESH] Session expired', 'AUTH', { sessionId: session.sessionId });
      return await setMessage('TokenExpired', null, 401);
    }

    // Validate user account status
    const statusValidation = await validateUser(session.user.status);
    if (statusValidation) {
      return statusValidation;
    }

    // Generate new token pair
    const tokenPayload = {
      sessionId: session.sessionId,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      imageUrl: session.user.imageUrl,
      roles: session.user.userRoles.map((ur: { role: { id: string } }) => ur.role.id),
      fingerprint: fingerprint
    };

    const { accessToken, refreshToken: newRefreshToken } = tokenServer.genTokenPair(tokenPayload);

    // Update session with new tokens and extend expiry (30일로 연장)
    const newExpiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일
    const updateResult = await updateSession(session.sessionId, {
      refreshToken: newRefreshToken,
      lastActivityTime: new Date(),
      expiresTime: newExpiryTime,
      updateTime: new Date()
    });

    logger.info('[REFRESH] Session extended', 'AUTH', {
      sessionId: session.sessionId,
      newExpiry: newExpiryTime,
      userId: session.user.id
    });

    if (!updateResult) {
      logger.error('[REFRESH] Failed to update session', 'AUTH', { sessionId: session.sessionId });
      return await setMessage('UnknownError', null, 500);
    }

    logger.info('[REFRESH] Token generation successful', 'AUTH', { sessionId: session.sessionId });
    return await setMessage('loginSuccess', {
      token: accessToken,
      refreshToken: newRefreshToken
    }, 200);
  } catch (error) {
    logger.error('[REFRESH] Token generation error', 'AUTH', error);
    return await setMessage('UnknownError', null, 500);
  }
}

async function validateUser(status: string): Promise<APIResult | null> {
  if (status === 'suspended') {
    return await setMessage('AccountSuspended', null, 403);
  }
  if (status === 'inactive') {
    return await setMessage('AccountInactive', null, 403);
  }
  return null;
}
// Main refresh function with reduced complexity
export const refresh = async (request: NextRequest): Promise<APIResult> => {
  try {
    // Step 1: Validate request
    const requestValidation = await validateRequest(request);
    if (requestValidation) return requestValidation;

    const { type } = await request.json();

    // Step 2: Validate request type
    const typeValidation = await validateType(type);
    if (typeValidation) return typeValidation;

    // Step 3: Extract and validate tokens
    const tokens = extractTokens(request);
    const tokenValidation = await validateTokens(tokens);
    if (tokenValidation) return tokenValidation;

    // Step 4: Validate refresh token
    const refreshValidation = await validateToken(tokens.refreshToken!, tokens.fingerprint!);
    if ('success' in refreshValidation || 'message' in refreshValidation) {
      return refreshValidation;
    }

    const tokenValidationResult = refreshValidation as TokenValidationResult;

    // Step 5: Handle different request types
    if (type === "refresh") {
      return await refreshToken(request, tokenValidationResult);
    }

    // Step 6: Handle token generation
    return await tokenGen(tokenValidationResult, tokens.fingerprint!, tokens.refreshToken!);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token refresh error:', error);
    }
    return await setMessage('UnknownError', null, 500);
  }
};
