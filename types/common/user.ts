// Unified User interface - combines auth and admin user types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  phoneNumber?: string | null;
  marketing?: boolean;
  terms?: boolean;
  status: string;
  lastLoginTime: string | null;
  createdTime: string;
  updatedTime?: string;
  roles: string[];
  
  // Profile information
  profile?: {
    name?: string | null;
    nickname?: string;
    imageUrl?: string;
  };
  
  // Authentication details
  auth?: {
    emailVerified: boolean;
    phoneVerified?: boolean;
    twoFactor?: boolean;
    status?: string;
  } | null;
  
  // Social login support
  authProvider?: 'email' | 'kakao' | 'google' | 'naver' | 'apple';
  socialAccounts?: {
    provider: string;
    providerId: string;
    email?: string;
    name?: string;
    profileImage?: string;
  }[];
  
  // Session information
  activeSessions?: number;
  totalNotifications?: number;
}

export interface UserResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

export interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}