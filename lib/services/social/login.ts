import { requestInfo } from "@/lib/server/info";
import { tokenServer } from "@/lib/services/token/server";
import { authServerConfig } from "@/constants/auth/server";
import { logger } from "@/lib/services/logger";
import { 
  SocialProvider, 
  SocialUserInfo, 
  SocialLoginResult,
  ProviderTokens,
  OAuthTokenResponse 
} from "@/types/social";
import { randomUUID } from "crypto";
import { extractErrorMessage } from "@/lib/auth/utils";

// DB 유틸리티 함수 임포트
import { createSession } from "@/lib/db/session";
import { createUser, updateUser, createSocialAccount, findUserByEmail, findSocialAccount, updateSocialAccount } from "@/lib/db/user";
import { setUserRole, searchRole, createRole } from "@/lib/db/roles";
import { history } from "@/lib/db/history";
import { request } from "@/lib/fetch";

/**
 * 소셜 로그인 통합 처리 서비스 (Next.js 15.4.3 최적화)
 * 
 * 플로우:
 * 1. OAuth 토큰 교환
 * 2. 사용자 정보 조회
 * 3. DB 사용자 확인 및 처리 (기존/신규/연결)
 * 4. JWT 토큰 생성
 * 5. 세션 생성
 * 6. 히스토리 기록
 */

interface SocialLoginParams {
  provider: SocialProvider;
  code: string;
  clientInfo: ReturnType<typeof requestInfo>;
  fingerprint?: string;
}

// Extract OAuth flow processing
async function processOAuthFlow(provider: SocialProvider, code: string): Promise<{ userInfo: SocialUserInfo; providerTokens: ProviderTokens }> {
  const tokenResponse = await token(provider, code);
  if (!tokenResponse.access_token) {
    throw new Error(`Failed to get access token from ${provider}`);
  }

  const userInfo = await fetchUserInfo(provider, tokenResponse.access_token);
  if (!userInfo.id) {
    throw new Error(`Failed to get user info from ${provider}`);
  }

  const providerTokens: ProviderTokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresIn: tokenResponse.expires_in,
    scope: tokenResponse.scope
  };

  return { userInfo, providerTokens };
}

// Extract session creation logic
async function createUserSession(
  user: any,
  clientInfo: ReturnType<typeof requestInfo>,
  fingerprint?: string
): Promise<{ accessToken: string; refreshToken: string; sessionId: string; expiresTime: Date }> {
  const sessionId = randomUUID();
  const expiresTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const tokenPayload = {
    sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    roles: user.userRoles?.map((ur: any) => ur.role.id),
    fingerprint: fingerprint
  };

  const { accessToken, refreshToken } = tokenServer.genTokenPair(tokenPayload);

  await createSession({
    sessionId,
    user: { connect: { id: user.id } },
    refreshToken,
    deviceInfo: JSON.stringify(clientInfo),
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    loginType: 'social',
    expiresTime
  });

  return { accessToken, refreshToken, sessionId, expiresTime };
}

/**
 * 메인 소셜 로그인 처리 함수 - Simplified for reduced complexity
 */
export async function processSocial({
  provider,
  code,
  clientInfo,
  fingerprint
}: SocialLoginParams): Promise<SocialLoginResult> {
  
  try {
    // 1-2. OAuth flow processing
    const { userInfo, providerTokens } = await processOAuthFlow(provider, code);

    // 3. Database user handling
    const userResult = await handleUserInDatabase(userInfo, provider, providerTokens);
    if ('error' in userResult) {
      return createFailureResult(userResult.error);
    }
    const user = userResult;

    // 4-5. Session and token creation
    const { accessToken, refreshToken, sessionId, expiresTime } = await createUserSession(user, clientInfo, fingerprint);

    // 6. History and final updates
    await Promise.all([
      history(user.email, true, clientInfo),
      updateUser({ id: user.id }, { lastLoginTime: new Date() })
    ]);

    return createSuccessResult(user, accessToken, refreshToken, sessionId, expiresTime);

  } catch (error) {
    return await handleSocialLoginError(error, provider, clientInfo);
  }
}

// Extract error handling
async function handleSocialLoginError(
  error: unknown,
  provider: SocialProvider,
  clientInfo: ReturnType<typeof requestInfo>
): Promise<SocialLoginResult> {
  const errorMsg = extractErrorMessage(error);
  console.error(`[${provider}] Social login failed:`, errorMsg);
  
  // Record failure history
  const email = `unknown_${provider}_user`;
  await history(email, false, clientInfo);
  
  // Determine error message type
  const errorMessage = determineErrorType(errorMsg);
  return createFailureResult(errorMessage);
}

// Extract error type determination
function determineErrorType(errorMsg: string): string {
  if (errorMsg.includes('Account suspended')) {
    return "AccountSuspended";
  }
  if (errorMsg.includes('Account inactive')) {
    return "AccountInactive";
  }
  if (errorMsg.includes('access token') || 
      errorMsg.includes('user info') || 
      errorMsg.includes('configuration')) {
    return "AuthError";
  }
  return "UnknownError";
}

// Types for social account handling
interface ExistingSocialAccount {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    status: string;
  };
}

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  status?: string;
  userRoles?: any[];
}

// Extract existing social account handling
async function handleExistingSocialAccount(
  existingSocial: ExistingSocialAccount,
  userInfo: SocialUserInfo,
  providerTokens: ProviderTokens,
  provider: SocialProvider
): Promise<UserData | { error: string }> {
  const user = existingSocial.user;
  
  const statusError = validateUserStatus(user.status);
  if (statusError) return statusError;
  
  const userUpdateData = buildUserUpdateData(userInfo, user);
  
  if (Object.keys(userUpdateData).length > 0) {
    await updateUser({ id: user.id }, userUpdateData);
  }

  await updateTokens(existingSocial.id, userInfo, providerTokens, provider);
  return { ...user, ...userUpdateData };
}

// Extract user update data building
function buildUserUpdateData(userInfo: SocialUserInfo, user: any): Record<string, any> {
  const updateData: Record<string, any> = {};
  
  if (userInfo.email && user.email.endsWith('@social.user')) {
    updateData.email = userInfo.email;
  }
  
  if (userInfo.name && userInfo.name !== user.name) {
    updateData.name = userInfo.name;
  }
  
  if (userInfo.profileImage && userInfo.profileImage !== user.imageUrl) {
    updateData.imageUrl = userInfo.profileImage;
  }
  
  return updateData;
}

// Extract existing user linking
async function handleExistingUserLinking(
  existingUser: UserData,
  userInfo: SocialUserInfo,
  providerTokens: ProviderTokens,
  provider: SocialProvider
): Promise<UserData | { error: string }> {
  const statusError = validateUserStatus(existingUser.status || 'active');
  if (statusError) return statusError;
  
  await createSocialAccount({
    user: { connect: { id: existingUser.id } },
    email: userInfo.email || existingUser.email,
    social: provider,
    socialId: userInfo.id.toString(),
    profileData: createProfileData(userInfo),
    ...tokenData(providerTokens, provider)
  } as any);

  return existingUser;
}

// Extract new user creation
async function handleNewUserCreation(
  userInfo: SocialUserInfo,
  providerTokens: ProviderTokens,
  provider: SocialProvider
): Promise<UserData> {
  const newUser = await createUser({
    email: userInfo.email || `${provider}_${userInfo.id}@social.user`,
    name: userInfo.name || 'Social User',
    imageUrl: userInfo.profileImage || null,
    status: 'active',
    terms: true,
    marketing: false,
    socialLogins: {
      create: {
        email: userInfo.email || `${provider}_${userInfo.id}@social.user`,
        social: provider,
        socialId: userInfo.id.toString(),
        profileData: createProfileData(userInfo),
        ...tokenData(providerTokens, provider)
      }
    }
  });

  assignDefaultRoleAsync(newUser.id, provider).catch(error => {
    console.warn(`[${provider}] Could not assign default role:`, extractErrorMessage(error));
  });

  return newUser;
}

/**
 * 데이터베이스에서 사용자 처리 - Simplified for reduced complexity
 */
async function handleUserInDatabase(
  userInfo: SocialUserInfo, 
  provider: SocialProvider,
  providerTokens: ProviderTokens
): Promise<UserData | { error: string }> {
  
  const [existingSocial, existingUser] = await Promise.all([
    findSocialAccount(userInfo.id.toString(), provider),
    userInfo.email ? findUserByEmail(userInfo.email) : null
  ]);

  // CASE 1: 기존 소셜 계정
  if (existingSocial) {
    return await handleExistingSocialAccount(existingSocial, userInfo, providerTokens, provider);
  }

  // CASE 2: 이메일 계정 연동
  if (existingUser) {
    return await handleExistingUserLinking(existingUser, userInfo, providerTokens, provider);
  }

  // CASE 3: 신규 사용자
  return await handleNewUserCreation(userInfo, providerTokens, provider);
}

/**
 * 소셜 토큰 정보 업데이트 (최적화됨)
 */
async function updateTokens(
  socialId: string,
  userInfo: SocialUserInfo,
  providerTokens: ProviderTokens,
  provider: SocialProvider
) {
  const updateData = {
    profileData: createProfileData(userInfo),
    updateTime: new Date(),
    ...tokenData(providerTokens, provider)
  };

  await updateSocialAccount(socialId, updateData);
}

/**
 * 소셜 토큰 데이터 구성
 */
function tokenData(providerTokens: ProviderTokens, provider: SocialProvider) {
  const data: Record<string, unknown> = {
    accessToken: providerTokens.accessToken,
    refreshToken: providerTokens.refreshToken || null,
    scope: providerTokens.scope || null
  };

  // 액세스 토큰 만료 시간
  if (providerTokens.expiresIn) {
    data.accessExpires = new Date(Date.now() + (providerTokens.expiresIn * 1000));
  }

  // 리프레시 토큰 만료 시간 (플랫폼별 차이)
  if (providerTokens.refreshToken) {
    const refreshExpiresInDays = provider === 'kakao' ? 60 : 30;
    data.refreshExpires = new Date(Date.now() + (refreshExpiresInDays * 24 * 60 * 60 * 1000));
  }

  return data;
}

// 헬퍼 함수들

/**
 * 사용자 상태 검사 유틸리티
 */
function validateUserStatus(status: string): { error: string } | null {
  if (status === 'suspended') return { error: 'AccountSuspended' };
  if (status === 'inactive') return { error: 'AccountInactive' };
  return null;
}

/**
 * 성공 결과 생성 유틸리티
 */
function createSuccessResult(
  user: any,
  accessToken: string,
  refreshToken: string,
  sessionId: string,
  expiresTime: Date
): SocialLoginResult {
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || '',
      imageUrl: user.imageUrl || undefined,
      roles: user.userRoles?.map((ur: any) => ur.role.id) || ['user'],
      tokenExpiry: Math.floor(Date.now() / 1000) + (15 * 60)
    },
    tokens: { accessToken, refreshToken },
    session: { sessionId, expiresTime }
  };
}

/**
 * 실패 결과 생성 유틸리티
 */
function createFailureResult(errorMessage: string): SocialLoginResult {
  return {
    success: false,
    message: errorMessage,
    user: { id: "", email: "", name: "", imageUrl: "", roles: ['guest'], tokenExpiry: 0 },
    tokens: { accessToken: "", refreshToken: "" },
    session: { sessionId: "", expiresTime: new Date(0) }
  };
}

/**
 * 프로필 데이터 생성 유틸리티
 */
function createProfileData(userInfo: SocialUserInfo) {
  return {
    name: userInfo.name,
    email: userInfo.email,
    profileImage: userInfo.profileImage
  };
}

/**
 * 비동기 기본 역할 할당
 */
async function assignDefaultRoleAsync(userId: string, provider: SocialProvider) {
  await ensureDefaultRoleExists();
  const userRole = await searchRole('user');
  if (userRole) {
    await setUserRole(userId, userRole.id);
  } else {
    console.warn(`[${provider}] Default 'user' role not found`);
  }
}

/**
 * 기본 'user' 역할 존재 여부 확인 및 생성
 */
async function ensureDefaultRoleExists() {
  try {
    const existingRole = await searchRole('user');
    if (!existingRole) {
      await createRole({
        id: 'user',
        name: 'user',
        description: 'Default user role'
      });
    }
  } catch (error) {
    console.error('Failed to ensure default role exists:', extractErrorMessage(error));
  }
}

/**
 * OAuth 토큰 교환
 */
async function token(provider: SocialProvider, code: string): Promise<OAuthTokenResponse> {
  const config = authServerConfig.social[provider as keyof typeof authServerConfig.social];
  
  if (!config) {
    throw new Error(`No configuration found for provider: ${provider}`);
  }

  const tokenData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.appID,
    code,
    redirect_uri: config.redirect
  });

  // client_secret 추가 (Apple은 다른 방식 사용)
  if (provider !== 'apple' && 'appSecret' in config) {
    tokenData.append('client_secret', config.appSecret);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };

  if ('headers' in config && config.headers) {
    Object.assign(headers, config.headers);
  }


  try {
    // fetch 대신 request.post 사용
    const { data } = await request.post<OAuthTokenResponse>(
      config.token,
      tokenData.toString(),
      { headers }
    );

    return data;
    
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    console.error(`[${provider}] Token exchange error:`, errorMsg);
    throw new Error(`Token exchange failed: ${errorMsg}`);
  }
}

/**
 * 사용자 정보 조회
 */
async function fetchUserInfo(provider: SocialProvider, accessToken: string): Promise<SocialUserInfo> {
  const config = authServerConfig.social[provider as keyof typeof authServerConfig.social];
  
  if (!config) {
    throw new Error(`No configuration found for provider: ${provider}`);
  }

  // Apple은 userInfo 엔드포인트가 없고 ID token에서 정보를 추출
  if (provider === 'apple') {
    // Apple의 경우 JWT 토큰에서 사용자 정보 추출
    return appleUserInfo(accessToken);
  }

  if (!('userInfo' in config)) {
    throw new Error(`No user info endpoint found for provider: ${provider}`);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  };

  if ('headers' in config && config.headers) {
    Object.assign(headers, config.headers);
    headers['Authorization'] = `Bearer ${accessToken}`;
  }


  try {
    // Use request.get instead of fetch
    const { data } = await request.get<any>(config.userInfo, { headers });
    
    // Provider-specific mapping
    return userInfo(provider, data);
    
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    console.error(`[${provider}] User info fetch error:`, errorMsg);
    throw new Error(`User info fetch failed: ${errorMsg}`);
  }
}

/**
 * Apple JWT 토큰에서 사용자 정보 추출
 */
function appleUserInfo(idToken: string): SocialUserInfo {
  try {
    // JWT는 base64로 인코딩되어 있고, header.payload.signature 형식
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // payload 부분을 디코딩
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.email?.split('@')[0] || '',
      profileImage: undefined,
      provider: 'apple'
    };
  } catch (error) {
    logger.error('Failed to decode Apple ID token', 'AUTH', error);
    throw new Error('Invalid Apple ID token');
  }
}

/**
 * 프로바이더별 사용자 정보 매핑
 */
function userInfo(provider: SocialProvider, rawData: any): SocialUserInfo {
  switch (provider) {
    case 'google':
      return {
        id: rawData.id,
        email: rawData.email,
        name: rawData.name,
        profileImage: rawData.picture,
        provider: 'google'
      };
      
    case 'kakao':
      return {
        id: String(rawData.id),
        email: rawData.kakao_account?.email || '',
        name: rawData.kakao_account?.profile?.nickname || rawData.properties?.nickname || '',
        profileImage: rawData.kakao_account?.profile?.profile_image_url || rawData.properties?.profile_image,
        provider: 'kakao'
      };
      
    case 'naver':
      return {
        id: rawData.response?.id,
        email: rawData.response?.email,
        name: rawData.response?.name,
        profileImage: rawData.response?.profile_image,
        provider: 'naver'
      };
      
    case 'apple':
      return {
        id: rawData.sub,
        email: rawData.email,
        name: rawData.email?.split('@')[0] || '',
        profileImage: undefined,
        provider: 'apple'
      };
      
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

