// Authentication Types

import { JwtPayload } from "jsonwebtoken";
import { APIResult } from "./api";
import { User } from './user';
import { Session } from './session';

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

// Re-exported for backward compatibility
export type { User };

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



// Re-exported for backward compatibility
export type { Session };

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
