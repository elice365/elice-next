import { JwtPayload } from "jsonwebtoken";

// 기본 토큰 페이로드 (성공적인 토큰)
export interface TokenPayload extends JwtPayload {
  sessionId: string;
  userId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  roles: string[];
  type: 'access' | 'refresh';
  fingerprint: string;
}

// 토큰 에러 응답
export interface TokenError {
  type: 'denied';
  message: 'InvalidToken' | 'TokenExpired' | 'TokenVerification' | 'UnknownError';
  status: 400 | 401 | 500;
}

// 토큰 결과 (성공 또는 실패)
export type TokenResult = TokenPayload | TokenError;

// 토큰 쌍
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// 클라이언트 토큰 저장소
export interface ClientTokens {
  accessToken: string | null;
  refreshToken: string | null; // refreshToken 추가
}

// API 매니저 인터페이스
export interface TokenManager {
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
}

// 토큰 생성용 페이로드 (type, iat, exp 제외)
export type TokenGenerationPayload = Omit<TokenPayload, 'type' | 'iat' | 'exp'>;