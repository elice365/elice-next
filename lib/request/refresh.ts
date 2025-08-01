import { APIResult } from "@/types/api";
import { NextRequest } from "next/server";
import { tokenServer } from "../services/token/server";
import { searchSession, searchSessionId, updateSession } from "@/lib/db/session";
import { setMessage } from "../response";
import { requestIP } from "../server/info";
import { prisma } from "@/lib/db/prisma";

// Types for token validation
interface TokenValidationResult {
  sessionId: string;
  userId: string;
  fingerprint: string;
}

interface RefreshTokens {
  refreshToken?: string;
  fingerprint?: string;
}

// Validation functions to reduce complexity
async function validateRequest(request: NextRequest): Promise<APIResult | null> {
  if (request.method !== 'POST') {
    return await setMessage('InvalidType', null, 405);
  }
  return null;
}

async function validateRequestType(type: string): Promise<APIResult | null> {
  if (!["refresh", "token"].includes(type)) {
    return await setMessage('InvalidType', null, 405);
  }
  return null;
}

function extractTokensFromCookies(request: NextRequest): RefreshTokens {
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

async function validateRefreshToken(refreshToken: string, fingerprint: string): Promise<TokenValidationResult | APIResult> {
  try {
    const refreshTokenResult = tokenServer.verifyRefreshToken(refreshToken);

    if (!refreshTokenResult) {
      console.warn('[REFRESH] Invalid refresh token structure');
      return await setMessage('InvalidToken', null, 401);
    }

    const {
      sessionId: refreshsessionId,
      userId: refreshUserId,
      fingerprint: refreshfp
    } = refreshTokenResult;

    if (!refreshsessionId) {
      console.warn('[REFRESH] Missing sessionId in refresh token');
      return await setMessage('InvalidToken', null, 401);
    }

    if (refreshfp !== fingerprint) {
      console.warn('[REFRESH] Fingerprint mismatch:', { expected: refreshfp, received: fingerprint });
      return await setMessage('InvalidToken', null, 401);
    }

    return {
      sessionId: refreshsessionId,
      userId: refreshUserId,
      fingerprint: refreshfp
    };
  } catch (error) {
    console.error('[REFRESH] Token validation error:', error);
    return await setMessage('InvalidToken', null, 401);
  }
}

async function handleRefreshTokenRequest(
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
  const ipValidationResult = await validateIPAddress(request, session);
  if (ipValidationResult) {
    return ipValidationResult;
  }

  return await setMessage('loginSuccess', {
    refreshToken: session?.refreshToken
  }, 200);
}

async function validateIPAddress(request: NextRequest, session: any): Promise<APIResult | null> {
  const currentIP = await requestIP(request);

  if (session.active && session.ipAddress && session.ipAddress !== currentIP) {
    await updateSession(session.sessionId, { active: false });
    return await setMessage('TokenDenied', null, 401);
  }

  return null;
}

async function handleTokenGeneration(
  tokenValidation: TokenValidationResult,
  fingerprint: string,
  refreshToken: string
): Promise<APIResult> {
  try {
    const session = await searchSession(refreshToken, tokenValidation.userId);

    if (!session) {
      return await setMessage('TokenExpired', null, 401);
    }

    // Check if session is still active
    if (!session.active) {
      console.warn('[REFRESH] Session is not active:', session.sessionId);
      return await setMessage('TokenExpired', null, 401);
    }

    // Check if session is expired
    if (new Date(session.expiresTime) < new Date()) {
      console.warn('[REFRESH] Session expired:', session.sessionId);
      return await setMessage('TokenExpired', null, 401);
    }

    // Validate user account status
    const statusValidation = await validateUserStatus(session.user.status);
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

    // Update session with new tokens and extend expiry (14일로 연장)
    const newExpiryTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14일
    const updateResult = await updateSession(session.sessionId, {
      refreshToken: newRefreshToken,
      lastActivityTime: new Date(),
      expiresTime: newExpiryTime,
      updateTime: new Date()
    });
    
    console.log('[REFRESH] Session extended:', {
      sessionId: session.sessionId,
      newExpiry: newExpiryTime,
      userId: session.user.id
    });

    if (!updateResult) {
      console.error('[REFRESH] Failed to update session:', session.sessionId);
      return await setMessage('UnknownError', null, 500);
    }

    console.log('[REFRESH] Token generation successful for session:', session.sessionId);
    return await setMessage('loginSuccess', {
      token: accessToken,
      refreshToken: newRefreshToken
    }, 200);
  } catch (error) {
    console.error('[REFRESH] Token generation error:', error);
    return await setMessage('UnknownError', null, 500);
  }
}

async function validateUserStatus(status: string): Promise<APIResult | null> {
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
    const typeValidation = await validateRequestType(type);
    if (typeValidation) return typeValidation;

    // Step 3: Extract and validate tokens
    const tokens = extractTokensFromCookies(request);
    const tokenValidation = await validateTokens(tokens);
        if (tokenValidation) return tokenValidation;

    // Step 4: Validate refresh token
    const refreshValidation = await validateRefreshToken(tokens.refreshToken!, tokens.fingerprint!);
    if ('success' in refreshValidation || 'message' in refreshValidation) {
      return refreshValidation;
    }

    const tokenValidationResult = refreshValidation as TokenValidationResult;

    // Step 5: Handle different request types
    if (type === "refresh") {
      return await handleRefreshTokenRequest(request, tokenValidationResult);
    }

    // Step 6: Handle token generation
    return await handleTokenGeneration(tokenValidationResult, tokens.fingerprint!, tokens.refreshToken!);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token refresh error:', error);
    }
    return await setMessage('UnknownError', null, 500);
  }
};
