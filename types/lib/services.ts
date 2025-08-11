// Service Layer Type Definitions

import { JwtPayload } from 'jsonwebtoken';

// Social login types
export interface SocialLoginParams {
  provider: 'kakao' | 'google' | 'naver' | 'apple';
  code: string;
  state?: string;
  redirectUri?: string;
}

export interface ExistingSocialAccount {
  user: any;
  socialAccount: any;
}

export interface UserData {
  email: string;
  name?: string;
  image?: string;
  provider: string;
  providerId: string;
}

export interface MappingResult {
  success: boolean;
  provider: string;
  userData?: any;
  error?: string;
}

// Token types
export interface TokenPayload extends JwtPayload {
  uid: string;
  email: string;
  name?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  sub?: string;
}

export interface TokenError {
  type: 'EXPIRED' | 'INVALID' | 'MISSING' | 'VERIFICATION_FAILED';
  message: string;
  details?: any;
  statusCode: number;
  timestamp: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface ClientTokens {
  access: string;
  refresh?: string;
}

export interface TokenManager {
  create: (payload: TokenPayload) => Promise<TokenPair>;
  verify: (token: string) => Promise<TokenPayload>;
  refresh: (refreshToken: string) => Promise<TokenPair>;
  revoke: (token: string) => Promise<void>;
}

// Logger types
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  data?: any;
  error?: any;
  userId?: string;
  requestId?: string;
}

// Error types
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
  constraint?: string;
}

export interface ErrorHandlerOptions {
  logError?: boolean;
  sendEmail?: boolean;
  saveToDatabase?: boolean;
  includeStackTrace?: boolean;
}

// API client types
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Response types
export interface ResponseParams {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
  statusCode?: number;
}

// Auth types
export interface InitialAuthData {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export interface RefreshTokens {
  accessToken: string;
  refreshToken: string;
}