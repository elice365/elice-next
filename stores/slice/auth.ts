import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { api } from '@/lib/fetch';
import { authConfig } from '@/constants/auth/client';
import { Auth } from '@/types/auth';
import { create } from '@/stores/asyncThunk';
import { tokenClient } from '@/lib/services/token/client';
import { APIResult } from '@/types/api';
import { SocialProvider } from '@/types/social';
import { logger } from '@/lib/services/logger';

// User 정보 타입 정의
interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  roles: string[];
  tokenExpiry?: number;
}

// Auth 상태 타입 정의
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};



// 로그인 액션
export const login = create(
  'auth/login',
  async (credentials: Auth, { rejectWithValue }) => {
    const { data, headers } = await api.post<APIResult, Auth>(authConfig.endpoints.login, credentials);

    if (!data?.success) {
      return rejectWithValue(data?.message || 'Login failed: Invalid response from server.');
    }

    // 헤더에서 토큰 추출 (대소문자 구분 없이)
    const token = headers?.Authorization || headers?.authorization;

    if (!token) {
      return rejectWithValue('No token received');
    }

    // 토큰 저장
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    tokenClient.set(cleanToken);

    // 토큰에서 사용자 정보 추출
    const decoded = tokenClient.decode(cleanToken);

    if (!decoded?.userId || !decoded?.email || !decoded?.roles) {
      return rejectWithValue('Invalid token received');
    }

    const userInfo = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name ?? undefined,
      imageUrl: decoded.imageUrl ?? undefined,
      roles: decoded.roles,
      tokenExpiry: decoded.exp
    };

    return userInfo;
  }
);

// 회원가입 액션
export const register = create(
  'auth/register',
  async (credentials: Auth, { rejectWithValue }) => {
    const { data } = await api.post<APIResult, Auth>(authConfig.endpoints.register, credentials);
    if (!data?.success) {
      return rejectWithValue(data?.message || 'Registration failed: Invalid response from server.');
    }

    // 이메일 인증이 필요한 경우
    if (data.data?.emailVerification) {
      return {
        success: true,
        message: data.message,
        emailVerification: true
      };
    }

    // 기존 토큰 기반 처리 (이메일 인증이 필요 없는 경우)
    return rejectWithValue('Registration completed. Please check your email for verification.');
  }
);

export const social = create(
  'auth/social',
  async ({ type, code }: { type: SocialProvider; code: string }, { rejectWithValue }) => {
    try {
      const { data, headers } = await api.get<APIResult>(`/api/auth/${type}?code=${code}`);

      if (!data?.success) {
        return rejectWithValue(data?.message || 'Social login failed: Invalid response from server.');
      }

      const token = headers?.Authorization || headers?.authorization;

      if (!token) {
        return rejectWithValue('No token received');
      }
      
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      tokenClient.set(cleanToken);

      const decoded = tokenClient.decode(cleanToken);

      if (!decoded?.userId || !decoded?.email || !decoded?.roles) {
        return rejectWithValue('Invalid token received');
      }

      const userInfo = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name ?? undefined,
        imageUrl: decoded.imageUrl ?? undefined,
        roles: decoded.roles,
        tokenExpiry: decoded.exp
      };

      return userInfo;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Social login failed: Unknown error.';
      return rejectWithValue(errorMessage);
    }
  }
);

// 이메일 인증 액션
export const verify = create(
  'auth/verify',
  async (token: string, { rejectWithValue }) => {
    const { data, headers } = await api.post<{ success: boolean; message: string; data?: any }>(`/api/auth/verify`, { token });
    if (!data?.success) {
      return rejectWithValue(data?.message || 'Verification failed: Invalid response from server.');
    }

    // 헤더에서 토큰 추출 (로그인과 동일한 패턴)
    const accessToken = headers?.Authorization || headers?.authorization;
    
    if (accessToken) {
      const cleanToken = accessToken.startsWith('Bearer ') ? accessToken.substring(7) : accessToken;
      tokenClient.set(cleanToken);

      // 토큰에서 사용자 정보 추출
      const decoded = tokenClient.decode(cleanToken);
      
      if (decoded?.userId && decoded?.email && decoded?.roles) {
        return {
          success: true,
          message: data.message,
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name ?? undefined,
            imageUrl: decoded.imageUrl ?? undefined,
            roles: decoded.roles,
            tokenExpiry: decoded.exp
          }
        };
      }
    }

    return { success: true, message: data.message };
  }
);

// 이메일 재전송 액션
export const resendVerification = create(
  'auth/resend',
  async (email: string, { rejectWithValue }) => {
    const { data } = await api.post<{ success: boolean; message: string }>(`/api/auth/resend`, { email });
    if (!data?.success) {
      return rejectWithValue(data?.message || 'Resend verification failed: Invalid response from server.');
    }
    return { success: true, message: data.message };
  }
);

// 로그아웃 액션
export const logout = create(
  'auth/logout',
  async (_: void) => {
    try {
      await api.post(authConfig.endpoints.logout, {});
    } catch (error: any) {
      logger.warn('Logout server request failed', 'AUTH', error);
    } finally {
      tokenClient.clear();
    }
    return { success: true };
  }
);

// Auth slice 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as User;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Login failed';
      });

    // register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        // 이메일 인증이 필요한 경우 사용자 정보를 설정하지 않음
        const payload = action.payload as any;
        if (payload && 'emailVerification' in payload) {
          state.user = null;
          state.isAuthenticated = false;
          state.error = null;
        } else {
          state.user = payload as User;
          state.isAuthenticated = true;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Registration failed';
      });
    // social
    builder
      .addCase(social.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(social.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as User;
        state.isAuthenticated = true;
      })
      .addCase(social.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message 
        ?? action.error?.message
        ?? 'Social Login failed';
      });
    // logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // verify
    builder
      .addCase(verify.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verify.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verify.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || 'Verification failed';
      });
  },
});

export const { clearError, setError, setUser, clearUser } = authSlice.actions;

// Base selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Memoized selectors
export const selectUserRole = createSelector(
  [selectUser],
  (user) => user?.roles || []
);

export default authSlice.reducer;