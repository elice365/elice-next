// === 기본 소셜 프로바이더 타입 ===

// 지원되는 소셜 프로바이더
export type SocialProvider = 'kakao' | 'google' | 'naver' | 'apple';

// 공통 SNS 사용자 정보 인터페이스
export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  provider: SocialProvider;
}

// OAuth 토큰 응답
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

// === 소셜 프로바이더 시스템 타입 ===

// 프로바이더 설정
export interface SocialConfig {
  appID: string;
  appSecret?: string;
  redirect: string;
  token: string;
  userInfo?: string;
  revoke?: string;
  unlink?: string;
  headers?: Record<string, string>;
  scope?: string | string[];
}

export interface Config {
  appID: string;
  appSecret?: string;
  redirect: string;
  token: string;
  userInfo: string;
  revoke?: string;
  headers?: Record<string, string>;
  scope?: string[];
}


// 토큰 작업 타입
export interface TokenOp {
  type: 'login' | 'refresh';
  token: string;
}

// 사용자 정보 매퍼
export type Mapper<T = any> = (response: T) => SocialUserInfo;

// 프로바이더 메서드 인터페이스
export interface ProviderMethods {
  token: (operation: TokenOp) => Promise<OAuthTokenResponse>;
  userInfo: (accessToken: string) => Promise<SocialUserInfo>;
  validate: (accessToken: string) => Promise<boolean>;
  revoke: (accessToken: string) => Promise<boolean>;
}

// 소셜 프로바이더 컬렉션
export interface SocialProviders {
  google: ProviderMethods;
  kakao: ProviderMethods;
  naver: ProviderMethods;
  apple: ProviderMethods;
}

// === 프로바이더별 응답 타입 ===

// 카카오 사용자 정보 응답
export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image: string;
    thumbnail_image: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url: string;
      profile_image_url: string;
      is_default_image: boolean;
      is_default_nickname: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
  };
}

// 구글 사용자 정보 응답
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// 네이버 사용자 정보 응답
export interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname: string;
    name: string;
    email: string;
    gender: string;
    age: string;
    birthday: string;
    profile_image: string;
    birthyear: string;
    mobile: string;
  };
}

// 애플 사용자 정보 응답 (JWT 디코딩)
export interface AppleUserInfo {
  sub: string;
  email: string;
  email_verified: string;
  is_private_email: string;
  auth_time: number;
  nonce_supported: boolean;
}

// === 데이터베이스 연동 타입 ===

// 소셜 로그인 결과
export interface SocialLoginResult {
  success: boolean;
  message?: string;
  user: {
    id: string;
    email: string;
    name: string;
    imageUrl?: string;
    roles: string[];
    tokenExpiry?: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  session: {
    sessionId: string;
    expiresTime: Date;
  };
}

// 프로바이더 토큰 정보
export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

// === 요청/응답 타입 ===

// 소셜 인증 URL 요청
export interface SocialAuthRequest {
  type: SocialProvider;
  fingerprint?: string;
}

// 소셜 인증 URL 응답
export interface SocialAuthResponse {
  success: boolean;
  data?: string; // OAuth URL
  message?: string;
}

// 소셜 로그인 콜백 요청
export interface SocialCallbackRequest {
  code: string;
  state?: string;
  provider: SocialProvider;
}

// === 에러 타입 ===
export interface SocialError extends Error {
  provider: SocialProvider;
  operation: string;
  originalError?: any;
}

// === 유틸리티 타입 ===
export type SocialProviderKeys = keyof SocialProviders;

// 소셜 로그인 상태
export type SocialLoginStatus = 'idle' | 'loading' | 'success' | 'error';

// 팝업 메시지 타입 (기존 hooks/useSocialLogin.ts와 일치)
export interface SocialLoginMessage {
  type: 'SOCIAL_LOGIN_SUCCESS' | 'SOCIAL_LOGIN_ERROR';
  provider: string;
  user?: any;
  error?: string;
}


export type RawSocialUserInfo = GoogleUserInfo | KakaoUserInfo | NaverUserInfo | AppleUserInfo;