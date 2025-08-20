// FLO 서비스 통합 모듈

export * from './auth';
export * from './stream';

// FloAuth 클래스를 TypeScript로 재구현
import { checkFloVersion, validateFloToken, loginToFlo } from './auth';
import { getFloStreamUrl, getTrackInfo } from './stream';
import { FLO_CONFIG } from '@/constants/flo/play';
import { ReCaptchaV3Solver } from '@/utils/recaptcha/v3';
import type { FloAuthConfig, FloTokenValidationResponse } from '@/types/flo/play';

export class FloAuthClient {
  private config: FloAuthConfig;
  private sequenceNumber = 216;
  private recaptchaSolver?: ReCaptchaV3Solver;

  constructor(config: Partial<FloAuthConfig> = {}) {
    this.config = {
      appVersion: config.appVersion || FLO_CONFIG.DEFAULT_CONFIG.APP_VERSION,
      deviceId: config.deviceId || FLO_CONFIG.DEFAULT_CONFIG.DEVICE_ID,
      deviceModel: config.deviceModel || FLO_CONFIG.DEFAULT_CONFIG.DEVICE_MODEL,
      osVersion: config.osVersion || FLO_CONFIG.DEFAULT_CONFIG.OS_VERSION,
      buildNumber: config.buildNumber || FLO_CONFIG.DEFAULT_CONFIG.BUILD_NUMBER,
      apiKey: config.apiKey || FLO_CONFIG.DEFAULT_CONFIG.API_KEY,
      recaptchaSiteKey: config.recaptchaSiteKey || FLO_CONFIG.DEFAULT_CONFIG.RECAPTCHA_SITE_KEY
    };

    // reCAPTCHA 솔버 초기화
    try {
      this.recaptchaSolver = new ReCaptchaV3Solver({
        domain: 'music-flo.com',
        siteKey: this.config.recaptchaSiteKey,
        debug: false
      });
    } catch (error) {
      console.warn('reCAPTCHA solver initialization failed:', error);
    }
  }

  /**
   * 앱 버전 확인
   */
  async checkAppVersion() {
    return checkFloVersion(this.config);
  }

  /**
   * 토큰 검증
   */
  async validateToken(accessToken: string) {
    return validateFloToken(accessToken, this.config);
  }

  /**
   * 자동 reCAPTCHA 해결 및 로그인
   */
  async loginWithRecaptcha(email: string, password: string): Promise<FloTokenValidationResponse> {
    try {
      if (!this.recaptchaSolver) {
        return {
          success: false,
          valid: false,
          error: 'reCAPTCHA solver not available'
        };
      }

      // reCAPTCHA 토큰 획득
      const recaptchaResult = await this.recaptchaSolver.solve(this.config.recaptchaSiteKey);
      
      if (!recaptchaResult.success) {
        return {
          success: false,
          valid: false,
          error: 'Failed to solve reCAPTCHA'
        };
      }

      // 로그인 시도
      return await loginToFlo(email, password, recaptchaResult.token, this.config);
    } catch (error) {
      console.error('FLO login with reCAPTCHA error:', error);
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * 스트림 URL 가져오기
   */
  async getStreamUrl(resourceId: string, accessToken: string) {
    return getFloStreamUrl(resourceId, accessToken, this.config);
  }

  /**
   * 자동 로그인과 함께 스트림 URL 가져오기
   */
  async getStreamUrlWithAutoLogin(resourceId: string) {
    try {
      // 환경변수에서 FLO 계정 정보 가져오기
      const email = process.env.FLO_EMAIL;
      const password = process.env.FLO_PASSWORD;

      if (!email || !password) {
        throw new Error('FLO 계정 정보가 환경변수에 설정되지 않았습니다');
      }

      // 먼저 로그인 시도
      const loginResult = await this.loginWithRecaptcha(email, password);
      
      if (!loginResult.success || !loginResult.accessToken) {
        throw new Error(`FLO 로그인 실패: ${loginResult.error}`);
      }

      // 로그인 성공 후 스트림 URL 가져오기
      return this.getStreamUrl(resourceId, loginResult.accessToken);
      
    } catch (error) {
      console.error('Auto-login stream URL error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-login failed'
      };
    }
  }

  /**
   * 트랙 정보 가져오기
   */
  async getTrackInfo(trackId: string, accessToken: string) {
    return getTrackInfo(trackId, accessToken, this.config);
  }

  /**
   * JWT 토큰 디코딩
   */
  decodeJWT(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      
      const result: any = {
        raw: payload,
        subject: payload.sub,
        issuer: payload.iss,
        jti: payload.jti
      };

      if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        result.expiresAt = expiresAt.toISOString();
        
        const now = Date.now();
        const remaining = payload.exp * 1000 - now;
        result.isValid = remaining > 0;
        
        if (remaining > 0) {
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          result.remainingTime = `${days}일 ${hours}시간 ${minutes}분`;
        } else {
          result.remainingTime = 'Expired';
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return {
        error: error instanceof Error ? error.message : 'Invalid token',
        isValid: false
      };
    }
  }
}