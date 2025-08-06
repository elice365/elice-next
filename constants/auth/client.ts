// 순환 참조 방지를 위해 import 제거

export const GRANT_TYPES = {
  login: 'authorization_code',
  refresh: 'refresh_token'
} as const;

export const DEFAULT_HEADERS = {
  'Authorization': (token: string) => `Bearer ${token}`,
  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
} as const;


export const authConfig = {
  // 클라이언트 안전 설정 (비밀 정보 제거됨)
  socialType: ['google', 'kakao', 'naver', 'apple'] as const,
  
  // 쿠키 설정 (클라이언트 접근 가능)
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7일 (초)
  },
  
  // API 엔드포인트
  endpoints: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    verify: '/api/auth/verify',
    social: '/api/auth/social',
    
  },
  
  // 보안 설정
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15분
    sessionTimeout: 60 * 60 * 1000, // 1시간
    refreshThreshold: 5 * 60 * 1000, // 5분
    passwordMinLength: 8,
    accessToken: 15 * 60 * 1000, // 15분 (밀리초)
    refreshToken: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
    tokenRefresh: 5 * 60 * 1000, // 5분 전 갱신 (밀리초)
  },
  
  // 보호된 경로
  protected: [
    '/admin',    // 관리자 페이지 추가
    '/product',
  ],
  
  // 인증 불필요 경로
  public: [
    '/auth',
    '/login',
    '/register',
    '/notice',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/profile',
    '/api/auth/social',
    '/api/search',
  ],
  
  // 클라이언트용 소셜 로그인 이미지 정보 (비밀 정보 없음)
  socialImages: [
    { name: "Google", src: "https://cdn.elice.pro/images/sns/google.svg" },
    { name: "Naver", src: "https://cdn.elice.pro/images/sns/naver.svg" },
    { name: "Kakao", src: "https://cdn.elice.pro/images/sns/kakao.svg" },
    { name: "Apple", src: "https://cdn.elice.pro/images/sns/apple.svg" }
  ]
};
