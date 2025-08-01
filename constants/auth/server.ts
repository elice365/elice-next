// 서버 전용 인증 설정 - 클라이언트에 노출되지 않음

// Environment variable validation
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not defined`);
  }
  return value;
}

export const authServerConfig = {
  // JWT 설정 (서버 전용)
  jwtSecret: getRequiredEnvVar('JWT_SECRET'),
  refreshTokenSecret: getRequiredEnvVar('REFRESH_TOKEN_SECRET'),

  // 소셜 로그인 설정 (서버 전용)
  social: {
    kakao: {
      name: 'Kakao',
      appID: getRequiredEnvVar('KAKAO_CLIENT_ID'),
      appSecret: getRequiredEnvVar('KAKAO_CLIENT_SECRET'),
      redirect: `${getRequiredEnvVar('NEXT_PUBLIC_URL')}/auth/kakao`,
      auth: 'https://kauth.kakao.com/oauth/authorize',
      token: 'https://kauth.kakao.com/oauth/token',
      tokenInfo: 'https://kapi.kakao.com/v1/user/access_token_info',
      userInfo: 'https://kapi.kakao.com/v2/user/me',
      logout: `https://kapi.kakao.com/v1/user/logout`,
      logoutReturn: `https://kapi.kakao.com/v1/user/logout?client_id=${getRequiredEnvVar('KAKAO_CLIENT_ID')}&logout_redirect_uri=${getRequiredEnvVar('NEXT_PUBLIC_URL')}/auth/logout`,
      unlink: `https://kapi.kakao.com/v1/user/unlink`,
      scope: ['profile_nickname','profile_image account_email'],
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }
    },
    google: {
      name: 'Google',
      appID: getRequiredEnvVar('GOOGLE_CLIENT_ID'),
      appSecret: getRequiredEnvVar('GOOGLE_CLIENT_SECRET'),
      redirect: `${getRequiredEnvVar('NEXT_PUBLIC_URL')}/auth/google`,
      auth: 'https://accounts.google.com/o/oauth2/auth',
      token: 'https://oauth2.googleapis.com/token',
      userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid email profile'
    },
    naver: {
      name: 'Naver',
      appID: getRequiredEnvVar('NAVER_CLIENT_ID'),
      appSecret: getRequiredEnvVar('NAVER_CLIENT_SECRET'),
      redirect: `${getRequiredEnvVar('NEXT_PUBLIC_URL')}/auth/naver`,
      auth: 'https://nid.naver.com/oauth2.0/authorize',
      token: 'https://nid.naver.com/oauth2.0/token',
      userInfo: 'https://openapi.naver.com/v1/nid/me',
      scope: 'profile',
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }
    },
    apple: {
      name: 'Apple',
      appID: getRequiredEnvVar('APPLE_CLIENT_ID'),
      teamId: getRequiredEnvVar('APPLE_TEAM_ID'),
      keyId: getRequiredEnvVar('APPLE_KEY_ID'),
      privateKey: getRequiredEnvVar('APPLE_PRIVATE_KEY'),
      redirect: `${getRequiredEnvVar('NEXT_PUBLIC_URL')}/auth/apple`,
      auth: 'https://appleid.apple.com/auth/authorize',
      token: 'https://appleid.apple.com/auth/token',
      scope: 'name email'
    }
  }
};