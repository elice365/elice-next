// FLO 자동 로그인 및 세션 관리 시스템
import { upsertFloSession, isSessionExpired } from '@/lib/db/flo';
import { logger } from '@/utils/logger';

// FloAuth 클래스 타입 정의
interface FloAuthConfig {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  apiKey: string;
  autoSolveRecaptcha: boolean;
  recaptchaSiteKey: string;
}

interface FloAuthLoginResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  accessToken?: string;
  refreshToken?: string;
}

// 간단한 FLO API 클라이언트
class FloAuthClient {
  private readonly config: FloAuthConfig; // readonly 로 수정
  private sequenceNumber = 216;

  constructor() {
    this.config = {
      deviceId: 'CB1BB79B-98A9-4CD4-A757-5075E4FEBC2F',
      deviceModel: 'iPhone16,2',
      osVersion: '26.0',
      appVersion: '8.5.1',
      buildNumber: '20250804153854',
      apiKey: 'MjM0Yzk5ZjUwYjg1ODM1ZmYwNGJhNmY4NDA4NjUyMGQ=',
      autoSolveRecaptcha: true,
      recaptchaSiteKey: '6LfCVLAUAAAAALFwwRnnCJ12DalriUGbj8FW_J39'
    };
  }

  /**
   * FLO API 공통 헤더
   */
  private getCommonHeaders(contentLength = 0) {
    const headers = {
      'Host': 'api.music-flo.com',
      'Cache-Control': 'no-store',
      'User-Agent': `FLO/${this.config.appVersion} (kr.co.musicmates.radio; build:${this.config.buildNumber}; iOS ${this.config.osVersion}) Alamofire/5.8.0`,
      'x-gm-device-id': this.config.deviceId,
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'Content-Length': contentLength.toString(),
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Connection': 'keep-alive',
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${this.config.apiKey}`,
      'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
      'x-gm-app-name': 'FLO',
      'x-gm-device-model': this.config.deviceModel,
      'x-gm-app-version': this.config.appVersion,
      'x-gm-os-version': this.config.osVersion,
      'Accept': '*/*',
      'Content-Type': 'application/json; charset=UTF-8',
      'x-gm-os-type': 'IOS',
      'x-gm-seq': this.sequenceNumber.toString(),
      'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8'
    };

    this.sequenceNumber++;
    return headers;
  }

  /**
   * 간단한 FLO 로그인 (reCAPTCHA 없이)
   */
  private async loginToFlo(email: string, password: string): Promise<FloAuthLoginResult> {
    try {
      const loginData = {
        requestChannelType: 'IAPP',
        signInType: 'IDM',
        memberId: email,
        memberPwd: password,
        reCaptchaToken: '', // 일단 빈 값으로 시도
        reCaptchaReferer: 'IOS'
      };

      const jsonBody = JSON.stringify(loginData);
      const headers = this.getCommonHeaders(Buffer.byteLength(jsonBody, 'utf8'));

      const response = await fetch('https://api.music-flo.com/auth/v3/sign/in', {
        method: 'POST',
        headers,
        body: jsonBody
      });

      const result = await response.json();

      // 디버깅용 로그 (프로덕션에서는 제거)
      if (process.env.NODE_ENV === 'development') {
        logger.flo.debug('FLO 로그인 응답', {
          status: response.status,
          result: result,
          dataExists: !!result.data,
          accessToken: result.data?.accessToken ? 'exists' : 'missing',
          refreshToken: result.data?.refreshToken ? 'exists' : 'missing'
        });
      }

      if (response.status === 200 && result.data) {
        return {
          success: true,
          data: result.data,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken
        };
      } else {
        return {
          success: false,
          status: response.status,
          error: result.message || `HTTP ${response.status}`,
          data: result
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * FLO 자동 로그인 (환경변수에서 계정 정보 가져오기)
   */
  async autoLogin(): Promise<FloAuthLoginResult> {
    try {
      const email = process.env.FLO_EMAIL;
      const password = process.env.FLO_PASSWORD;

      if (!email || !password) {
        return {
          success: false,
          error: 'FLO 계정 정보가 환경변수에 설정되지 않았습니다. FLO_EMAIL과 FLO_PASSWORD를 설정하세요.'
        };
      }

      logger.flo.info('FLO 자동 로그인 시도 중');
      const result = await this.loginToFlo(email, password);

      if (result.success && result.data) {
        // 세션 데이터를 데이터베이스에 저장
        const savedSession = await this.saveSessionToDb(result.data);
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 세션 저장 결과:', savedSession ? 'success' : 'failed');
        }
        
        logger.flo.info('FLO 로그인 성공 및 세션 저장 완료');
        return result;
      } else {
        logger.flo.error('FLO 로그인 실패', { error: result.error });
        return result;
      }
    } catch (error) {
      logger.flo.error('FLO 자동 로그인 오류', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 세션 데이터를 데이터베이스에 저장
   */
  private async saveSessionToDb(sessionData: any): Promise<any> {
    try {
      const expiresAt = this.calculateTokenExpiry(sessionData.accessToken);
      
      const savedSession = await upsertFloSession({
        appVersion: this.config.appVersion,
        latestVersion: this.config.appVersion, // 초기값
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresAt: new Date(expiresAt)
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 upsertFloSession 결과:', savedSession ? 'success' : 'null');
      }
      return savedSession;
    } catch (error) {
      console.error('세션 저장 실패:', error);
      throw error;
    }
  }

  /**
   * JWT 토큰에서 만료 시간 계산
   */
  private calculateTokenExpiry(token: string): string {
    try {
      const decoded = this.decodeJWT(token);
      if (decoded.raw?.exp) {
        return new Date(decoded.raw.exp * 1000).toISOString();
      }
    } catch (error) {
      // 토큰 디코딩 실패 - 로깅 추가
      console.warn('Failed to decode JWT token for expiry calculation:', error);
    }
    
    // 기본값: 30일 후
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * JWT 토큰 디코딩
   */
  private decodeJWT(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      
      return {
        raw: payload,
        subject: payload.sub,
        issuer: payload.iss,
        jti: payload.jti
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return {
        error: error instanceof Error ? error.message : 'Invalid token',
        isValid: false
      };
    }
  }

  /**
   * 앱 버전 확인
   */
  async checkAppVersion() {
    try {
      const headers = this.getCommonHeaders();
      const response = await fetch('https://api.music-flo.com/app/v1/version', {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (response.status === 200 && result.data) {
        return {
          success: true,
          data: {
            version: result.data.latestVersion || result.data.version,
            updateRequired: result.data.updateRequired || false
          }
        };
      } else {
        return {
          success: false,
          error: result.message || 'Version check failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Version check failed'
      };
    }
  }

  /**
   * 토큰 검증
   */
  async validateToken(accessToken: string) {
    try {
      const headers = {
        ...this.getCommonHeaders(),
        'x-gm-access-token': accessToken
      };

      const response = await fetch('https://api.music-flo.com/auth/v3/token/validate', {
        method: 'POST',
        headers
      });

      const result = await response.json();

      if (response.status === 200) {
        return {
          success: true,
          valid: true,
          accessToken: result.data?.accessToken || accessToken,
          refreshToken: result.data?.refreshToken,
          expiresAt: result.data?.expiresAt
        };
      } else {
        return {
          success: false,
          valid: false,
          error: result.message || 'Token validation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * 스트림 URL 가져오기
   */
  async getMusicStreamUrl(trackId: string, accessToken?: string) {
    try {
      console.log(`🎵 Getting music stream URL for track: ${trackId}`);
      
      // 세션에서 액세스 토큰 가져오기
      if (!accessToken) {
        console.log('📋 Getting valid session for stream URL...');
        const session = await this.getValidSession();
        if (!session) {
          console.error('❌ No valid session found for stream URL');
          return {
            success: false,
            error: 'FLO 세션을 찾을 수 없습니다. 로그인이 필요합니다.'
          };
        }
        accessToken = session.accessToken;
        console.log('✅ Valid session found, access token obtained');
      }

      const params = new URLSearchParams({
        bitrate: 'aac',
        flacYn: 'N',
        hlsYn: 'N',
        resourceType: 'MUSIC',
        skipDislikeYn: 'Y'
      });

      const headers = {
        'Host': 'api.music-flo.com',
        'Cache-Control': 'no-store',
        'User-Agent': `FLO/${this.config.appVersion} (kr.co.musicmates.radio; build:${this.config.buildNumber}; iOS ${this.config.osVersion}) Alamofire/5.8.0`,
        'x-gm-device-id': this.config.deviceId,
        'x-gm-dvc-disp-nm': 'aVBob25l',
        'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
        'Connection': 'keep-alive',
        'x-gm-request-time': Date.now().toString(),
        'Authorization': `FLO ${this.config.apiKey}`,
        'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
        'x-gm-app-name': 'FLO',
        'x-gm-device-model': this.config.deviceModel,
        'x-gm-app-version': this.config.appVersion,
        'x-gm-os-version': this.config.osVersion,
        'Accept': '*/*',
        'Content-Type': 'application/json; charset=UTF-8',
        'x-gm-os-type': 'IOS',
        'x-gm-seq': this.sequenceNumber.toString(),
        'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
        'x-gm-access-token': accessToken
      };

      this.sequenceNumber++;

      const url = `https://api.music-flo.com/stream/v2/resource/${trackId}/listen/url?${params.toString()}`;
      console.log(`🌐 Calling FLO stream API for track: ${trackId}`);
      
      const response = await fetch(url, { headers });
      const result = await response.json();

      // 디버깅용 로그 (보안을 위해 URL 제외)
      console.log('🔍 FLO 스트림 API 응답:', {
        status: response.status,
        code: result?.code,
        dataExists: !!result?.data,
        hasUrl: !!result?.data?.url,
        message: result?.message,
        hasCustomCode: !!result?.data?.customCode
      });

      if (response.status === 200 && result.code === '2000000' && result.data) {
        // 커스텀 오류 코드 체크
        if (result.data.customCode) {
          console.error(`❌ FLO 커스텀 오류 발생 (${result.data.customCode}):`, result.data.customDefaultMsg || result.data.customMsg);
          return {
            success: false,
            error: result.data.customDefaultMsg || result.data.customMsg || 'FLO 서비스 오류'
          };
        }
        
        console.log(`✅ Stream URL successfully obtained for track: ${trackId}`);
        return {
          success: true,
          streamUrl: result.data.url, // Use 'url' field from FLO API response
          data: result.data
        };
      } else {
        console.error(`❌ FLO API 오류 - Status: ${response.status}, Code: ${result?.code}, Message: ${result?.message}`);
        return {
          success: false,
          error: result.message || `FLO API 오류: HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error(`💥 스트림 URL 가져오기 중 예외 발생 (Track: ${trackId}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '스트림 URL 가져오기 실패'
      };
    }
  }

  /**
   * V컬러링 비디오 스트림 URL 가져오기
   */
  async getVcoloringStreamUrl(videoId: string, accessToken?: string) {
    try {
      console.log(`🎥 Getting V컬러링 stream URL for video: ${videoId}`);
      
      // 세션에서 액세스 토큰 가져오기
      if (!accessToken) {
        console.log('📋 Getting valid session for V컬러링 stream URL...');
        const session = await this.getValidSession();
        if (!session) {
          console.error('❌ No valid session found for V컬러링 stream URL');
          return {
            success: false,
            error: 'FLO 세션을 찾을 수 없습니다. 로그인이 필요합니다.'
          };
        }
        accessToken = session.accessToken;
        console.log('✅ Valid session found, access token obtained');
      }

      const headers = {
        'Host': 'api.music-flo.com',
        'x-gm-dvc-disp-nm': 'aVBob25l', // iPhone 디바이스명 (Base64)
        'x-gm-os-version': this.config.osVersion,
        'Authorization': `FLO ${this.config.apiKey}`,
        'x-gm-device-id': this.config.deviceId,
        'x-gm-request-time': Date.now().toString(),
        'Content-MD5': '8e050af438f664df2b6c6bad309fbcdc',
        'Accept': '*/*',
        'x-gm-device-model': this.config.deviceModel,
        'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
        'x-gm-app-name': 'FLO',
        'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
        'x-gm-os-type': 'IOS',
        'x-gm-seq': this.sequenceNumber.toString(),
        'User-Agent': `FLO/${this.config.appVersion} (kr.co.musicmates.radio; build:${this.config.buildNumber}; iOS ${this.config.osVersion}) Alamofire/5.8.0`,
        'Connection': 'keep-alive',
        'Content-Type': 'application/json; charset=UTF-8',
        'x-gm-app-version': this.config.appVersion,
        'x-gm-access-token': accessToken
      };

      this.sequenceNumber++;

      const url = `https://api.music-flo.com/stream/v1/videos/${videoId}/watch/url?quality=720p`;
      console.log(`🌐 Calling FLO V컬러링 stream API for video: ${videoId}`);
      
      const response = await fetch(url, { headers });
      const result = await response.json();

      // 디버깅용 로그 (보안을 위해 URL 제외)
      console.log('🔍 FLO V컬러링 스트림 API 응답:', {
        status: response.status,
        code: result?.code,
        dataExists: !!result?.data,
        hasUrl: !!result?.data?.url,
        message: result?.message,
        hasCustomCode: !!result?.data?.customCode
      });

      if (response.status === 200 && result.code === '2000000' && result.data) {
        // 커스텀 오류 코드 체크
        if (result.data.customCode && result.data.customCode !== 0) {
          console.error(`❌ FLO V컬러링 커스텀 오류 발생 (${result.data.customCode}):`, result.data.customDefaultMsg || result.data.customMsg);
          return {
            success: false,
            error: result.data.customDefaultMsg || result.data.customMsg || 'FLO V컬러링 서비스 오류'
          };
        }
        
        console.log(`✅ V컬러링 stream URL successfully obtained for video: ${videoId}`);
        return {
          success: true,
          streamUrl: result.data.url, // HLS manifest URL
          data: result.data
        };
      } else {
        console.error(`❌ FLO V컬러링 API 오류 - Status: ${response.status}, Code: ${result?.code}, Message: ${result?.message}`);
        return {
          success: false,
          error: result.message || `FLO V컬러링 API 오류: HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error(`💥 V컬러링 스트림 URL 가져오기 중 예외 발생 (Video: ${videoId}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'V컬러링 스트림 URL 가져오기 실패'
      };
    }
  }

  /**
   * 유효한 세션 가져오기 (없으면 자동 로그인)
   */
  private async getValidSession() {
    try {
      console.log('🔐 Checking for valid FLO session...');
      const { getFloSession } = await import('@/lib/db/flo');
      let session = await getFloSession();

      if (!session) {
        console.log('❌ No FLO session found, attempting auto-login...');
      } else if (isSessionExpired(session)) {
        console.log('⏰ FLO session expired, attempting auto-login...');
      } else {
        console.log('✅ Valid FLO session found');
        return session;
      }

      const loginResult = await this.autoLogin();
      if (!loginResult.success) {
        console.error(`❌ Auto-login failed: ${loginResult.error}`);
        throw new Error(`자동 로그인 실패: ${loginResult.error}`);
      }

      session = await getFloSession();
      if (!session) {
        console.error('❌ No session found after successful login');
        throw new Error('로그인 후 세션을 찾을 수 없습니다');
      }

      console.log('✅ Auto-login successful, session obtained');
      return session;
    } catch (error) {
      console.error('💥 세션 가져오기 실패:', error);
      return null;
    }
  }
}

// Export the class and create a singleton instance
export { FloAuthClient };

// Create and export singleton instance for easy use
export const autoLoginClient = new FloAuthClient();
