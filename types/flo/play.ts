// FLO 재생 시스템 타입 정의

export interface FloPlayRequest {
  resource: string; // 곡 아이디
}

export interface FloPlayResponse {
  success: boolean;
  streamUrl?: string;
  error?: string;
  data?: {
    url: string;
    bitrate: string;
    duration: number;
    format: string;
  };
}

export interface FloSessionData {
  id: string;
  appVersion: string;
  latestVersion: string;
  accessToken: string;
  refreshToken?: string;
  savedAt: string;
  expiresAt: string;
}

export interface FloVersionResponse {
  success: boolean;
  data?: {
    version: string;
    forceUpdate: boolean;
    minVersion: string;
  };
  error?: string;
}

export interface FloTokenValidationResponse {
  success: boolean;
  valid: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface FloStreamResponse {
  success: boolean;
  data?: {
    url: string;
    streamUrl: string;
    bitrate: string;
    duration: number;
    format: string;
  };
  error?: string;
}

export interface FloAuthConfig {
  appVersion: string;
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  buildNumber: string;
  apiKey: string;
  recaptchaSiteKey: string;
}

