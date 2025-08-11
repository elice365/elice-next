// Token and Request Library Type Definitions

export interface TokenValidationResult {
  sessionId: string;
  userId: string;
  fingerprint: string;
}

export interface RefreshTokens {
  refreshToken?: string;
  fingerprint?: string;
}