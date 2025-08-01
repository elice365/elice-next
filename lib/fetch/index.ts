import { createAPI } from '@/lib/fetch/api';
import { tokenManager } from '@/lib/services/token/manager';

// 내부 API 통신을 위한 클라이언트 인스턴스 (토큰 매니저 포함)
export const api = createAPI({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  tokenManager: tokenManager
});

// 외부 API 통신을 위한 클라이언트 인스턴스 (토큰 매니저 없음)
export const request = createAPI({
  timeout: 10000,
});