//Form

import { JwtPayload } from "jsonwebtoken";
import { APIResult } from "./api";

export type AuthType = 'login' | 'register' | 'logout' | 'verify' | 'me' | 'refresh' | 'resend' | 'social' | 'kakao' | 'google' | 'naver' | 'apple';
export type FormType = "login" | "register" | "kyc";
export interface AuthFormField {
  name: string;
  type: 'email' | 'password' | 'text';
  label: string;
  autoComplete?: 'on' | 'off';
  compareValue?: string;
  onChange?: boolean;
}

export interface MeJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthFormProps {
  title: string;
  fields: AuthFormField[];
  onSubmit: (formData: any) => Promise<void>;
  successRedirect?: string;
  validate?: (formData: any) => string | null;
  showSocialLogin?: boolean;
}

//참조


export interface User {
  id: string;
  email: string;
  profile?: {
    name?: string | null;
    nickname?: string;
    imageUrl?: string;
  };
  // 이메일 인증 상태 추가
  emailVerified?: boolean;
  // SNS 로그인 지원을 위한 필드 추가
  authProvider?: 'email' | 'kakao' | 'google' | 'naver' | 'apple';
  socialAccounts?: {
    provider: string;
    providerId: string;
    email?: string;
    name?: string;
    profileImage?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  role: Role;
}


//Auth
export interface Auth {
  email: string;
  password: string;
  fingerprint?:string
  confirmPassword?:string;
}
export interface AuthResponse extends APIResult {
  data?: {
    user: User;
    message?: string;
    emailSent?: boolean;
  };
}



export interface Session {
  sessionId: string;
  lastActivityTime: Date;
  deviceInfo: string;
  ipAddress: string;
}

export interface AuthDetails {
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactor: boolean;
  status: string;
}

export interface UserCounts {
  sessions: number;
  notifications: number;
}


export interface UserWithRelations {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  imageUrl: string | null;
  gender: string | null;
  birthDate: Date | null;
  marketing: boolean;
  terms: boolean;
  status: string;
  lastLoginTime: Date | null;
  createdTime: Date;
  updateTime: Date;
  userRoles: UserRole[];
  sessions: Session[];
  auth: AuthDetails;
  _count: UserCounts;
}
