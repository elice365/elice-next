// FLO 재생 시스템 상수

export const FLO_CONFIG = {
  API_BASE_URL: 'https://api.music-flo.com',
  ENDPOINTS: {
    APP_VERSION: '/common/v1/app/version',
    TOKEN_VALIDATION: '/auth/v1/token',
    STREAM_URL: '/stream/v2/resource',
    AUTH_LOGIN: '/auth/v3/sign/in'
  },
  STREAM_PARAMS: {
    BITRATE: 'aac',
    FLAC_YN: 'N',
    HLS_YN: 'N',
    RESOURCE_TYPE: 'MUSIC',
    SKIP_DISLIKE_YN: 'Y'
  },
  DEFAULT_CONFIG: {
    APP_VERSION: '8.5.1',
    DEVICE_MODEL: 'iPhone16,2',
    OS_VERSION: '26.0',
    BUILD_NUMBER: '20250804153854',
    API_KEY: 'MjM0Yzk5ZjUwYjg1ODM1ZmYwNGJhNmY4NDA4NjUyMGQ=',
    RECAPTCHA_SITE_KEY: '6LfCVLAUAAAAALFwwRnnCJ12DalriUGbj8FW_J39',
    DEVICE_ID: 'CB1BB79B-98A9-4CD4-A757-5075E4FEBC2F'
  },
  HEADERS: {
    USER_AGENT: 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0) Alamofire/5.8.0',
    CONTENT_TYPE: 'application/json; charset=UTF-8',
    ACCEPT_LANGUAGE: 'ko-KR;q=1.0, en-KR;q=0.9',
    ACCEPT_ENCODING: 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
    OS_TYPE: 'IOS',
    APP_NAME: 'FLO'
  },
  TOKEN_EXPIRY_THRESHOLD: 30 * 60 * 1000, // 30분
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000 // 7일
} as const;

export const FLO_ERRORS = {
  NOT_AUTHENTICATED: 'FLO 인증이 필요합니다',
  TOKEN_EXPIRED: 'FLO 토큰이 만료되었습니다',
  INVALID_RESOURCE: '유효하지 않은 음원 ID입니다',
  STREAM_UNAVAILABLE: '스트림 URL을 가져올 수 없습니다',
  VERSION_CHECK_FAILED: '앱 버전 확인에 실패했습니다',
  LOGIN_REQUIRED: 'FLO 로그인이 필요합니다'
} as const;