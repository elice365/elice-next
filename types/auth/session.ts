// Unified Session types for both auth and admin management

export interface Session {
  sessionId: string;
  userId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  loginType: string;
  active: boolean;
  lastActivityTime: Date;
  expiresTime: Date;
  createdTime: Date;
  updateTime?: Date;
  
  // User information (when needed)
  user: {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    status: string;
    roles: string[];
  };
}

export interface SessionResponse {
  sessions: Session[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  loginTypeCounts: Record<string, number>;
}