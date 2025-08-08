import { COOKIE } from '@/i18n/route';
import { NextRequest, NextResponse } from 'next/server';
import { limitAPI } from './lib/server/limit';
import { createResponse } from './lib/server/response';
import { setMessage } from './lib/response';
import { authConfig } from './constants/auth/client';
import { country } from './utils/type/country';
import { requestInfo } from './lib/server/info';
import { logger } from './utils/logger';


// Helper functions to reduce complexity
function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}

function handleDeviceTracking(request: NextRequest, response: NextResponse) {
  const deviceInfoCookie = request.cookies.get('deviceInfo');
  
  if (deviceInfoCookie) {
    logger.debug('Device tracking cookie already exists', 'API');
    return;
  }
  
  const { ipAddress, userAgent } = requestInfo(request);
  logger.debug('Extracting client info for device tracking', 'API', { 
    ipAddress: ipAddress?.substring(0, 8) + '***',
    userAgent: userAgent?.substring(0, 50) + '...' 
  });
  
  // Skip axios requests
  if (!ipAddress || !userAgent || userAgent.includes('axios')) {
    logger.debug('Skipping cookie - axios request or invalid client info', 'API', {
      hasIpAddress: !!ipAddress,
      hasUserAgent: !!userAgent,
      isAxiosRequest: userAgent?.includes('axios') || false
    });
    return;
  }
  
  // Set device tracking cookie
  const deviceInfo = JSON.stringify({ ipAddress, userAgent });
  logger.info('Setting device tracking cookie for real client', 'API', {
    hasValidInfo: true,
    isAxiosRequest: false
  });
  
  response.cookies.set('deviceInfo', deviceInfo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400
  });
}

function handleLanguageDetection(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(COOKIE)) {
    return;
  }
  
  const countryCode = request.headers.get('cf-ipcountry');
  const language = countryCode ? country(countryCode) : 'ko';
  response.cookies.set(COOKIE, language);
}

async function checkAuthorization(request: NextRequest, pathname: string) {
  const productRouter = authConfig.protected.some(route => pathname.startsWith(route));
  const publicRouter = authConfig.public.some(route => pathname === route || pathname.startsWith(route));
  
  if (!productRouter || publicRouter) {
    return null;
  }
  
  const refreshToken = request.cookies.get("token")?.value;
  if (refreshToken) {
    return null;
  }
  
  if (pathname.startsWith('/api/')) {
    return createResponse(await setMessage('Unauthorized', null, 401));
  }
  
  return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  logger.debug('Processing middleware request', 'API', { pathname });
  
  // Device tracking
  handleDeviceTracking(request, response);
  
  // Security headers
  setSecurityHeaders(response);
  
  // Language detection
  handleLanguageDetection(request, response);
  
  // Rate limiting
  const rateLimitResult = await limitAPI(request, request.url, 100);
  if (!rateLimitResult.access) {
    return createResponse(await setMessage("APILimit", null, 429));
  }
  
  // Skip auth endpoints
  if (pathname.startsWith('/api/auth')) {
    return response;
  }
  
  // Authorization check
  const authResponse = await checkAuthorization(request, pathname);
  if (authResponse) {
    return authResponse;
  }
  
  return response;
}


export const config = {
  matcher: [
    // 정적 파일 제외하고 모든 경로에 미들웨어 적용
    '/((?!_next/static|_next/image|favicon.ico|images|sitemap|robots|_vercel|public|worker|pages|index).*)',
    // API 경로 포함
    '/api/:path*',
  ],
};