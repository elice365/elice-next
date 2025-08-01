import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import crypto from 'crypto';
import { authServerConfig } from '@/constants/auth/server';
import { 
  TokenPayload, 
  TokenError, 
  TokenResult, 
  TokenPair, 
  TokenGenerationPayload 
} from './types';

// 환경 변수
const JWT_SECRET = authServerConfig.jwtSecret;
const REFRESH_TOKEN_SECRET = authServerConfig.refreshTokenSecret;

/**
 * 서버 전용 토큰 서비스
 * JWT 검증, 생성 및 AES256 refresh 토큰 관리
 */
export const tokenServer = {
  /**
   * 토큰 검증 (JWT)
   * @param token - 검증할 토큰
   * @param requiredType - 요구되는 토큰 타입
   * @returns TokenPayload 또는 TokenError
   */
  verify: (
    token: string,
    requiredType: 'access' | 'refresh' = 'access'
  ): TokenResult => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      // 토큰 타입 검증
      if (decoded.type !== requiredType) {
        return { 
          type: 'denied', 
          message: 'InvalidToken', 
          status: 401 
        } as TokenError;
      }
      
      return decoded;
    } catch (error) {
      // 토큰 만료
      if (error instanceof TokenExpiredError) {
        return { 
          type: 'denied', 
          message: 'TokenExpired', 
          status: 401 
        } as TokenError;
      }
      
      // 토큰 검증 실패
      if (error instanceof JsonWebTokenError) {
        return { 
          type: 'denied', 
          message: 'TokenVerification', 
          status: 400 
        } as TokenError;
      }

      return { 
        type: 'denied', 
        message: 'UnknownError', 
        status: 500 
      } as TokenError;
    }
  },

  /**
   * Access Token 생성 (JWT)
   * @param payload - 토큰에 포함할 데이터
   * @returns JWT 토큰 문자열
   */
  genAccessToken: (payload: TokenGenerationPayload): string => {
    return jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' } // 15분
    );
  },

  /**
   * Refresh Token 생성 (AES256-GCM)
   * @param payload - 토큰에 포함할 데이터
   * @returns 암호화된 refresh 토큰
   */
  genRefreshToken: (payload: TokenGenerationPayload): string => {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(REFRESH_TOKEN_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const tokenData = JSON.stringify({
      ...payload,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7일
    });
    
    let encrypted = cipher.update(tokenData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV, 암호화된 데이터, 인증 태그를 합쳐서 반환
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  },

  /**
   * Refresh Token 검증 및 디코딩 (AES256-GCM)
   * @param token - 검증할 refresh 토큰
   * @returns TokenPayload 또는 null
   */
  verifyRefreshToken: (token: string): TokenPayload | null => {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(REFRESH_TOKEN_SECRET, 'salt', 32);
      
      const [ivHex, encryptedHex, authTagHex] = token.split(':');
      if (!ivHex || !encryptedHex || !authTagHex) {
        return null;
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const payload = JSON.parse(decrypted) as TokenPayload;
      
      // 만료 시간 확인
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  },

  /**
   * Access Token 검증 (JWT) - 별도 메서드
   * @param token - 검증할 access 토큰
   * @returns TokenPayload 또는 null
   */
  verifyAccessToken: (token: string): TokenPayload | null => {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return payload;
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  },

  /**
   * 토큰 쌍 생성 (Access + Refresh)
   * @param payload - 토큰에 포함할 데이터
   * @returns AccessToken과 RefreshToken 쌍
   */
  genTokenPair: (payload: TokenGenerationPayload): TokenPair => {
    const accessToken = tokenServer.genAccessToken(payload);
    const refreshToken = tokenServer.genRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken
    };
  }
};