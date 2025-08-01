import { NextRequest, NextResponse } from 'next/server';
import { APIResult } from '@/types/api';
import { setMessage } from '@/lib/response';
import { logout } from '@/lib/request/logout';
import { login } from '@/lib/request/login';
import { register } from '@/lib/request/register';
import { verify } from '@/lib/request/verify';
import { refresh } from '@/lib/request/refresh';
import { createResponse } from '@/lib/server/response';
import { me } from '@/lib/request/me';
import { resend } from '@/lib/request/resend';
import { social, socialLogin } from '@/lib/request/social';
import { limitAPI } from '@/lib/server/limit';
import { clearAuthCookies, setRefreshToken } from '@/lib/cookie/auth';
import { extractErrorMessage } from '@/lib/auth/utils';
import { logger } from '@/lib/services/logger';


// Auth type handler mapping
const authHandlers = {
  login,
  register, 
  verify,
  logout,
  me,
  refresh,
  resend,
  social: socialLogin,
  kakao: social,
  google: social,
  naver: social,
  apple: social
} as const;

type AuthType = keyof typeof authHandlers;

// Check if auth type needs token response
function needsTokenResponse(type: string): boolean {
  return ['login', 'register', 'refresh', 'kakao', 'google', 'naver', 'apple','social'].includes(type);
}

// Handle token response creation
function createTokenResponse(result: APIResult): NextResponse {
  const { token, refreshToken, sessionId, fingerprint, ...data } = result.data;
  const response = NextResponse.json({ ...result, data });

  if (token) {
    response.headers.set('Authorization', `Bearer ${token}`);
  }
  if (fingerprint) {
    response.cookies.set('fp', fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  if (refreshToken) {
    setRefreshToken(response, refreshToken);
  }

  return response;
}

// Handle auth request processing
async function handleAuthRequest(type: string, request: NextRequest): Promise<APIResult> {
  if (type in authHandlers) {
    return await authHandlers[type as AuthType](request);
  }
  return await setMessage('InvalidType', null, 400);
}

// Handle response based on type and result
function handleAuthResponse(type: string, result: APIResult): NextResponse {
  // Token-based responses
  if (needsTokenResponse(type) && result.success && result.data) {
    return createTokenResponse(result);
  }

  // Logout success - clear cookies
  if (type === 'logout' && result.success) {
    const response = NextResponse.json(result);
    clearAuthCookies(response);
    return response;
  }

  // Refresh failure - clear cookies for security
  if (type === 'refresh' && !result.success) {
    const response = NextResponse.json(result, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  // Failed responses
  if (!result.success) {
    return createResponse({
      success: false,
      message: result.message,
      data: result.data,
      status: 400
    });
  }

  // Default response
  return NextResponse.json(result);
}

// Simplified main handler
const request = async (request: NextRequest, { params }: { params: Promise<{ type: string }> }): Promise<Response> => {
  try {
    // Rate limiting
    const rateLimitResult = await limitAPI(request, request.url, 30);
    if (!rateLimitResult.access) {
      const errorResult = await setMessage('APILimit', null, 429);
      return NextResponse.json(errorResult, { status: 429 });
    }

    const { type } = await params;
    const result = await handleAuthRequest(type, request);
    return handleAuthResponse(type, result);

  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    
    logger.error('Auth API error', 'AUTH', { errorMessage, error });
    
    const errorResult = await setMessage('UnknownError', null, 500);
    return NextResponse.json(errorResult, { status: 500 });
  }
};

export const POST = request;
export const GET = request;
