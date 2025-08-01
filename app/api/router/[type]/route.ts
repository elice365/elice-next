import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { roles } from '@/lib/server/roles';
import { APIResult, AuthInfo } from '@/types/api';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { Redis } from "@upstash/redis";

// Redis 인스턴스
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

/* ------------------------------------------------------------------
 * GET /api/router/[type]
 * ---------------------------------------------------------------- */
const router = async (
  request: NextRequest, 
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const userRoles = roles(request);
    // URL에서 type 추출
    const pathSegments = request.nextUrl.pathname.split('/');
    const type = pathSegments[pathSegments.length - 1];  // 'user' | 'admin'
    const cacheKey = `router:${type}`;

    // 1. Redis 캐시 조회
    const cached = await redis.json.get(cacheKey);
    if (cached) {
      return setRequest(cached);
    }

    // 2. 쿼리 조건 분기
    let whereCondition;
    if (type === 'admin') {
      whereCondition = { role: { equals: ['admin'] } };  // 오직 admin만
    } else {
      whereCondition = { role: { hasSome: userRoles } };  // 기존 로직 (사용자 권한)
    }

    // 3. DB에서 조회
    const routers = await prisma.router.findMany({
      where: whereCondition,
      select: { uid: true, name: true, path: true, icon: true },
      orderBy: { uid: 'asc' },
    });

    // 4. Redis에 캐시 저장 (만료 없음)
    await redis.json.set(cacheKey, '$', routers);

    return setRequest(routers);
  } catch (err) {
    console.error(`[API] /router/[type] GET error:`, err);
    return setMessage('NetworkError', null, 500);
  }
}

/* ------------------------------------------------------------------
 * App Router 캐싱 설정
 * ---------------------------------------------------------------- */
export const dynamic = 'force-dynamic'; // 라우트 결과를 항상 동적으로 생성

export const GET = handler(router, {
  limit: true,
});
