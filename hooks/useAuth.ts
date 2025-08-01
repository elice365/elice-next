import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { 
  login, 
  register, 
  logout, 
  verify, 
  resendVerification,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectUserRole,
  clearError,
  social
} from '@/stores/slice/auth';
import { Auth, AuthType } from '@/types/auth';
import { SocialProvider } from '@/types/social';
import { usePostHog } from 'posthog-js/react';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const posthog = usePostHog();
  
  // Selectors
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const userRole = useAppSelector(selectUserRole);

  // Actions
  const handleLogin = useCallback(async (credentials: Auth) => {
    const result = await dispatch(login(credentials)).unwrap();
    
    // PostHog 사용자 식별 및 로그인 이벤트 추적
    if (result.user) {
      posthog.identify(result.user.id, {
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
        login_method: 'email',
        user_status: 'active'
      });
      
      posthog.capture('user_logged_in', {
        method: 'email',
        user_id: result.user.id,
        roles: result.user.roles
      });
    }
    
    return result;
  }, [dispatch, posthog]);

  const handleRegister = useCallback(async (credentials: Auth) => {
    const result = await dispatch(register(credentials)).unwrap();
    
    // PostHog 회원가입 이벤트 추적
    if (result.user) {
      posthog.identify(result.user.id, {
        email: result.user.email,
        name: result.user.name,
        signup_method: 'email',
        user_status: 'pending_verification'
      });
      
      posthog.capture('user_registered', {
        method: 'email',
        user_id: result.user.id,
        email_verified: false
      });
    }
    
    return result;
  }, [dispatch, posthog]);

  const handleSocialLogin = useCallback(async (credentials: { type: SocialProvider; code: string }) => {
    const result = await dispatch(social(credentials)).unwrap();
    
    // PostHog 소셜 로그인 추적
    if (result.user) {
      posthog.identify(result.user.id, {
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
        login_method: credentials.type,
        user_status: 'active'
      });
      
      posthog.capture('user_logged_in', {
        method: credentials.type,
        user_id: result.user.id,
        social_provider: credentials.type
      });
    }
    
    return result;
  }, [dispatch, posthog]);

  const handleLogout = useCallback(async () => {
    // 로그아웃 이벤트 추적 (사용자 정보가 사라지기 전에)
    if (user) {
      posthog.capture('user_logged_out', {
        user_id: user.id,
        session_duration: Date.now() - (user.tokenExpiry || Date.now())
      });
    }
    
    const result = await dispatch(logout(undefined)).unwrap();
    
    // PostHog 사용자 식별 해제
    posthog.reset();
    
    return result;
  }, [dispatch, posthog, user]);

  const handleVerify = useCallback(async (token: string) => {
    const result = await dispatch(verify(token)).unwrap();
    
    // PostHog 이메일 인증 완료 추적
    if (result.user) {
      posthog.capture('email_verified', {
        user_id: result.user.id,
        verification_method: 'email_token'
      });
      
      // 사용자 상태 업데이트
      posthog.setPersonProperties({
        email_verified: true,
        user_status: 'active'
      });
    }
    
    return result;
  }, [dispatch, posthog]);


  const handleResendVerification = useCallback(async (email: string) => {
    return await dispatch(resendVerification(email)).unwrap();
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // API 요청을 위한 통합 함수
  const authRequest = useCallback(async (type: AuthType, payload?: any) => {
    try {
      switch (type) {
        case 'login':
          return await handleLogin(payload);
        case 'register':
          return await handleRegister(payload);
        case 'social':
          return await handleSocialLogin(payload);
        case 'verify':
          return await handleVerify(payload);
        case 'logout':
          return await handleLogout();
        default:
          throw new Error(`Unknown auth type: ${type}`);
      }
    } catch (error) {
      console.error(`Auth ${type} error:`, error);
      throw error;
    }
  }, [handleLogin, handleRegister, handleSocialLogin, handleVerify, handleLogout]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    social: handleSocialLogin,
    logout: handleLogout,
    verify: handleVerify,
    resendVerification: handleResendVerification,
    clearError: handleClearError,
    
    // Unified API request
    authRequest,
  };
};