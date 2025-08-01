// 사용자 데이터 타입 정의
export interface User {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  marketing: boolean;
  terms: boolean;
  status: string;
  lastLoginTime: string | null;
  createdTime: string;
  roles: string[];
  auth: {
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactor: boolean;
    status: string;
  } | null;
  activeSessions: number;
  totalNotifications: number;
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