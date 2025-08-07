import { COOKIE } from '@/i18n/route';
import { NextRequest, NextResponse } from 'next/server';
import { limitAPI } from './lib/server/limit';
import { createResponse } from './lib/server/response';
import { setMessage } from './lib/response';
import { authConfig } from './constants/auth/client';
import { country } from './utils/type/country';
import { requestInfo } from './lib/server/info';
import { logger } from './utils/logger';


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // === 실제 클라이언트 정보 쿠키 저장 (조회수 추적용) ===
  const deviceInfoCookie = request.cookies.get('deviceInfo');
  logger.debug('Processing middleware request', 'API', { pathname });
  
  if (!deviceInfoCookie) {
    const { ipAddress, userAgent } = requestInfo(request);
    logger.debug('Extracting client info for device tracking', 'API', { 
      ipAddress: ipAddress?.substring(0, 8) + '***', // Mask IP for privacy
      userAgent: userAgent?.substring(0, 50) + '...' 
    });
    
    // 실제 클라이언트인지 확인 (axios가 아닌 브라우저)
    if (ipAddress && userAgent && !userAgent.includes('axios')) {
      const deviceInfo = JSON.stringify({ ipAddress, userAgent });
      logger.info('Setting device tracking cookie for real client', 'API', {
        hasValidInfo: true,
        isAxiosRequest: false
      });
      response.cookies.set('deviceInfo', deviceInfo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24시간
      });
    } else {
      logger.debug('Skipping cookie - axios request or invalid client info', 'API', {
        hasIpAddress: !!ipAddress,
        hasUserAgent: !!userAgent,
        isAxiosRequest: userAgent?.includes('axios') || false
      });
    }
  } else {
    logger.debug('Device tracking cookie already exists', 'API');
  }

  // === 기본 보안 헤더 설정 ===
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');


  // === 언어 설정 (국가 기반 언어 감지) ===
  if (!request.cookies.get(COOKIE)) {
    const countryCode = request.headers.get('cf-ipcountry');
    const language = countryCode ? country(countryCode) : 'ko';
    response.cookies.set(COOKIE, language);
  }

  if (!(await limitAPI(request, request.url, 100)).access) {
    return createResponse(await setMessage("APILimit", null , 429));
  };

  if (pathname.startsWith('/api/auth')) {
    return response;
  }
  const productRouter = authConfig.protected.some(route => pathname.startsWith(route));
  const publicRouter = authConfig.public.some(route => pathname === route || pathname.startsWith(route));
  if (productRouter && !publicRouter) {
    const refreshToken = request.cookies.get("token")?.value;
    if (!refreshToken) {
      if (pathname.startsWith('/api/')) {
         return createResponse(await setMessage('Unauthorized', null ,401));
      }
      return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
    }
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