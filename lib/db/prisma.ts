import { PrismaClient } from '@prisma/client';

// 전역 Prisma 인스턴스 타입 정의
declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma 클라이언트 생성 함수
const createPrismaClient = () => {
  // Supabase 연결 URL 수정 (PgBouncer 사용)
  const databaseUrl = process.env.DATABASE_URL;
  
  // URL 파라미터 추가
  const urlWithParams = databaseUrl?.includes('?') 
    ? `${databaseUrl}&connection_limit=3&pool_timeout=30`
    : `${databaseUrl}?connection_limit=3&pool_timeout=30`;

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
    datasources: {
      db: {
        url: urlWithParams,
      },
    },
  });
};

// 싱글톤 패턴으로 Prisma 클라이언트 관리
export const prisma = global.prisma || createPrismaClient();

// 개발 환경에서만 전역 저장 (HMR 시 재사용)
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}