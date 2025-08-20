// FLO 인증 서비스

import { request } from '@/lib/fetch';
import { FLO_CONFIG, FLO_ERRORS } from '@/constants/flo/play';
import type { 
  FloVersionResponse, 
  FloTokenValidationResponse, 
  FloAuthConfig 
} from '@/types/flo/play';

/**
 * FLO 앱 버전 확인
 */
export async function checkFloVersion(config: FloAuthConfig): Promise<FloVersionResponse> {
  try {
    const headers = {
      'Host': 'api.music-flo.com',
      'x-gm-dvc-disp-nm': 'aVBob25l', // Base64 of "iPhone"
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${config.apiKey}`,
      'x-gm-device-id': config.deviceId,
      'x-gm-os-version': config.osVersion,
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Accept': '*/*',
      'x-gm-device-model': config.deviceModel,
      'Accept-Encoding': FLO_CONFIG.HEADERS.ACCEPT_ENCODING,
      'x-gm-app-name': FLO_CONFIG.HEADERS.APP_NAME,
      'Accept-Language': FLO_CONFIG.HEADERS.ACCEPT_LANGUAGE,
      'x-gm-os-type': FLO_CONFIG.HEADERS.OS_TYPE,
      'x-gm-seq': '216',
      'User-Agent': FLO_CONFIG.HEADERS.USER_AGENT,
      'Connection': 'keep-alive',
      'Content-Type': FLO_CONFIG.HEADERS.CONTENT_TYPE,
      'x-gm-app-version': config.appVersion
    };

    const response = await request.get(
      `${FLO_CONFIG.API_BASE_URL}${FLO_CONFIG.ENDPOINTS.APP_VERSION}`,
      { headers }
    );

    const responseData = response.data as any;
    if (responseData) {
      return {
        success: true,
        data: {
          version: responseData.latestVersion || responseData.version,
          forceUpdate: responseData.forceUpdate || false,
          minVersion: responseData.minVersion || config.appVersion
        }
      };
    }

    return {
      success: false,
      error: FLO_ERRORS.VERSION_CHECK_FAILED
    };
  } catch (error) {
    console.error('FLO version check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : FLO_ERRORS.VERSION_CHECK_FAILED
    };
  }
}

/**
 * FLO 토큰 유효성 검사
 */
export async function validateFloToken(
  accessToken: string,
  config: FloAuthConfig
): Promise<FloTokenValidationResponse> {
  try {
    const headers = {
      'Host': 'api.music-flo.com',
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${config.apiKey}`,
      'x-gm-device-id': config.deviceId,
      'x-gm-os-version': config.osVersion,
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Accept': '*/*',
      'x-gm-device-model': config.deviceModel,
      'Accept-Encoding': FLO_CONFIG.HEADERS.ACCEPT_ENCODING,
      'x-gm-app-name': FLO_CONFIG.HEADERS.APP_NAME,
      'Accept-Language': FLO_CONFIG.HEADERS.ACCEPT_LANGUAGE,
      'x-gm-os-type': FLO_CONFIG.HEADERS.OS_TYPE,
      'x-gm-seq': '217',
      'User-Agent': FLO_CONFIG.HEADERS.USER_AGENT,
      'Connection': 'keep-alive',
      'Content-Type': FLO_CONFIG.HEADERS.CONTENT_TYPE,
      'x-gm-app-version': config.appVersion,
      'x-gm-access-token': accessToken
    };

    const response = await request.get(
      `${FLO_CONFIG.API_BASE_URL}${FLO_CONFIG.ENDPOINTS.TOKEN_VALIDATION}`,
      { headers }
    );

    const tokenResponseData = response.data as any;
    if (tokenResponseData) {
      return {
        success: true,
        valid: true,
        accessToken: tokenResponseData?.accessToken,
        refreshToken: tokenResponseData?.refreshToken,
        expiresAt: tokenResponseData?.expiresAt
      };
    }

    return {
      success: true,
      valid: false,
      error: FLO_ERRORS.TOKEN_EXPIRED
    };
  } catch (error) {
    console.error('FLO token validation error:', error);
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : FLO_ERRORS.TOKEN_EXPIRED
    };
  }
}

/**
 * FLO 로그인 (reCAPTCHA 포함)
 */
export async function loginToFlo(
  email: string,
  password: string,
  reCaptchaToken: string,
  config: FloAuthConfig
): Promise<FloTokenValidationResponse> {
  try {
    const loginData = {
      requestChannelType: 'IAPP',
      signInType: 'IDM',
      memberId: email,
      memberPwd: password,
      reCaptchaToken,
      reCaptchaReferer: 'IOS'
    };

    const headers = {
      'Host': 'api.music-flo.com',
      'Cache-Control': 'no-store',
      'User-Agent': FLO_CONFIG.HEADERS.USER_AGENT,
      'x-gm-device-id': config.deviceId,
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'Content-Length': JSON.stringify(loginData).length.toString(),
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Connection': 'keep-alive',
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${config.apiKey}`,
      'Accept-Language': FLO_CONFIG.HEADERS.ACCEPT_LANGUAGE,
      'x-gm-app-name': FLO_CONFIG.HEADERS.APP_NAME,
      'x-gm-device-model': config.deviceModel,
      'x-gm-app-version': config.appVersion,
      'x-gm-os-version': config.osVersion,
      'Accept': '*/*',
      'Content-Type': FLO_CONFIG.HEADERS.CONTENT_TYPE,
      'x-gm-os-type': FLO_CONFIG.HEADERS.OS_TYPE,
      'x-gm-seq': '218',
      'Accept-Encoding': FLO_CONFIG.HEADERS.ACCEPT_ENCODING
    };

    const response = await request.post(
      `${FLO_CONFIG.API_BASE_URL}${FLO_CONFIG.ENDPOINTS.AUTH_LOGIN}`,
      loginData,
      { headers }
    );

    const loginResponseData = response.data as any;
    if (loginResponseData?.data) {
      const sessionData = loginResponseData.data;
      return {
        success: true,
        valid: true,
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresAt: sessionData.expiresAt
      };
    }

    return {
      success: false,
      valid: false,
      error: (response.data as any)?.message || FLO_ERRORS.LOGIN_REQUIRED
    };
  } catch (error) {
    console.error('FLO login error:', error);
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : FLO_ERRORS.LOGIN_REQUIRED
    };
  }
}