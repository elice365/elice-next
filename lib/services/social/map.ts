// Custom social provider mapping logic instead of external mappers
import {
  SocialProvider,
  SocialUserInfo,
  GoogleUserInfo,
  KakaoUserInfo,
  NaverUserInfo,
  AppleUserInfo,
  SocialError,
  RawSocialUserInfo
} from '@/types/social';
import { social, error as logError } from '@/lib/services/logger';


/**
 * 소셜 프로바이더 사용자 정보 매핑
 */
export async function UserInfo(
  provider: SocialProvider,
  rawResponse: RawSocialUserInfo
): Promise<SocialUserInfo> {

  try {

    const mappedInfo = perform(provider, rawResponse);

    validate(mappedInfo, provider);

    const normalizedInfo = normalize(mappedInfo);

    return normalizedInfo;

  } catch (error) {
    logError(`User info mapping failed`, provider.toUpperCase(), error);

    const socialError: SocialError = {
      name: 'SocialMappingError',
      message: `Failed to map ${provider} user info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      provider,
      operation: 'mapUserInfo',
      originalError: error
    };

    throw socialError;
  }
}

/**
 * 기본 매핑 수행 (기존 mappers.ts 활용)
 */
function perform(
  provider: SocialProvider,
  rawResponse: RawSocialUserInfo
): SocialUserInfo {

  // Direct mapping logic implementation (instead of external mappers.ts)
  switch (provider) {
    case 'google': {
      const googleInfo = rawResponse as GoogleUserInfo;
      return {
        id: googleInfo.id,
        email: googleInfo.email,
        name: googleInfo.name,
        profileImage: googleInfo.picture,
        provider: 'google'
      };
    }
    case 'kakao': {
      const kakaoInfo = rawResponse as KakaoUserInfo;
      return {
        id: String(kakaoInfo.id),
        email: kakaoInfo.kakao_account.email,
        name: kakaoInfo.kakao_account.profile.nickname,
        profileImage: kakaoInfo.kakao_account.profile.profile_image_url,
        provider: 'kakao'
      };
    }
    case 'naver': {
      const naverInfo = rawResponse as NaverUserInfo;
      return {
        id: naverInfo.response.id,
        email: naverInfo.response.email,
        name: naverInfo.response.name,
        profileImage: naverInfo.response.profile_image,
        provider: 'naver'
      };
    }
    case 'apple': {
      const appleInfo = rawResponse as AppleUserInfo;
      return {
        id: appleInfo.sub,
        email: appleInfo.email,
        name: appleInfo.email?.split('@')[0] || '',
        profileImage: undefined,
        provider: 'apple'
      };
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * 매핑된 사용자 정보 유효성 검증
 */
function validate(userInfo: SocialUserInfo, provider: SocialProvider): void {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!userInfo.id || userInfo.id.trim() === '') {
    errors.push('User ID is required');
  }

  if (!userInfo.provider || userInfo.provider !== provider) {
    errors.push(`Provider mismatch: expected ${provider}, got ${userInfo.provider}`);
  }

  // 이메일 검증 (일부 프로바이더는 이메일이 선택적일 수 있음)
  if (userInfo.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      errors.push('Invalid email format');
    }
  }

  // 이름 검증
  if (!userInfo.name || userInfo.name.trim() === '') {
    console.warn(`[${provider}] User name is empty, will use fallback`);
  }

  // 프로파일 이미지 URL 검증 (선택적)
  if (userInfo.profileImage) {
    try {
      new URL(userInfo.profileImage);
    } catch {
      console.warn(`[${provider}] Invalid profile image URL: ${userInfo.profileImage}`);
      // 잘못된 URL은 제거
      userInfo.profileImage = undefined;
    }
  }

  if (errors.length > 0) {
    throw new Error(`User info validation failed: ${errors.join(', ')}`);
  }
}

/**
 * 사용자 정보 정규화 및 정제
 */
function normalize(userInfo: SocialUserInfo): SocialUserInfo {
  return {
    id: userInfo.id.trim(),
    email: userInfo.email?.trim().toLowerCase() || '',
    name: userName(userInfo.name, userInfo.provider),
    profileImage: userInfo.profileImage || undefined,
    provider: userInfo.provider
  };
}

/**
 * 사용자 이름 정규화
 */
function userName(name: string, provider: SocialProvider): string {
  if (!name || name.trim() === '') {
    // 프로바이더별 기본 이름 설정
    const defaultNames = {
      google: 'Google User',
      kakao: 'Kakao User',
      naver: 'Naver User',
      apple: 'Apple User'
    };
    return defaultNames[provider];
  }

  // 이름 정제: 앞뒤 공백 제거, 연속 공백을 단일 공백으로 변환
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * 프로바이더별 특별 처리
 */
export function specificInfo(provider: SocialProvider, rawResponse: RawSocialUserInfo) {
  switch (provider) {
    case 'kakao': {
      const kakaoInfo = rawResponse as KakaoUserInfo;
      return {
        hasEmail: kakaoInfo.kakao_account?.has_email || false,
        emailVerified: kakaoInfo.kakao_account?.is_email_verified || false,
        isDefaultProfile: kakaoInfo.kakao_account?.profile?.is_default_image || false
      };
    }
    case 'google': {
      const googleInfo = rawResponse as GoogleUserInfo;
      return {
        emailVerified: googleInfo.verified_email || false,
        locale: googleInfo.locale || 'en'
      };
    }

    case 'naver': {
      const naverInfo = rawResponse as NaverUserInfo;
      return {
        gender: naverInfo.response?.gender,
        age: naverInfo.response?.age,
        birthday: naverInfo.response?.birthday,
        birthyear: naverInfo.response?.birthyear
      };
    }
    case 'apple': {
      const appleInfo = rawResponse as AppleUserInfo;
      return {
        emailVerified: appleInfo.email_verified === 'true',
        isPrivateEmail: appleInfo.is_private_email === 'true'
      };
    }
    default:
      return {};
  }
}

/**
 * 사용자 정보 안전성 검사
 */
export function isUserInfoSafe(userInfo: SocialUserInfo): boolean {
  try {
    // 기본적인 SQL Injection 패턴 검사
    const dangerousPatterns = [
      /['";]/g,                    // 따옴표들
      /union\s+select/gi,          // UNION SELECT
      /drop\s+table/gi,            // DROP TABLE
      /insert\s+into/gi,           // INSERT INTO
      /delete\s+from/gi,           // DELETE FROM
      /<script[^>]*>/gi,           // 스크립트 태그
      /javascript:/gi,             // javascript: 프로토콜
      /on\w+\s*=/gi               // Event handlers
    ];

    const fieldsToCheck = [userInfo.email, userInfo.name];

    for (const field of fieldsToCheck) {
      if (field) {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(field)) {
            console.warn(`Potentially dangerous pattern detected in user info: ${field}`);
            return false;
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error during user info safety check:', error);
    return false;
  }
}

/**
 * 매핑 결과 요약 정보
 */
export interface MappingResult {
  success: boolean;
  provider: SocialProvider;
  userInfo?: SocialUserInfo;
  additionalInfo?: Record<string, any>;
  warnings?: string[];
  error?: string;
}

/**
 * 종합적인 사용자 정보 매핑 및 검증
 */
export async function mapAndValidateSocialUser(
  provider: SocialProvider,
  rawResponse: RawSocialUserInfo
): Promise<MappingResult> {

  const result: MappingResult = {
    success: false,
    provider,
    warnings: []
  };

  try {
    // 1. Basic mapping
    const userInfo = await UserInfo(provider, rawResponse);

    // 2. 안전성 검사
    if (!isUserInfoSafe(userInfo)) {
      throw new Error('User info contains potentially dangerous content');
    }

    // 3. 프로바이더별 추가 정보
    const additionalInfo = specificInfo(provider, rawResponse);

    // 4. 경고 사항 수집
    const warnings: string[] = [];
    if (!userInfo.email) {
      warnings.push('No email provided by social provider');
    }
    if (!userInfo.profileImage) {
      warnings.push('No profile image provided by social provider');
    }

    result.success = true;
    result.userInfo = userInfo;
    result.additionalInfo = additionalInfo;
    result.warnings = warnings;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown mapping error';
    console.error(`[${provider}] Mapping and validation failed:`, error);
  }

  return result;
}