// 알림 타입 정의
export type NotificationType = 'notice' | 'payment' | 'system' | 'notification';

export interface NotificationData {
  type: string;
  id: string;
  title: string;
  content: string;
  read: boolean;
  date: number;
  link?: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: NotificationData[];
  notices: NotificationData[];
}

// API 요청/응답 타입
export interface CreateNotificationRequest {
  targetUserId?: string;
  category: string;
  title: string;
  content: string;
  link?: string;
}

export interface ReadNotificationRequest {
  type: 'read';
  select: 'notification' | 'notice';
  id: string;
}

// 단순화된 알림 서비스 인터페이스
export interface NotificationServiceInterface {
  get: (userId: string) => Promise<NotificationResponse>;
  add: (userId: string, data: Omit<NotificationData, 'id' | 'read' | 'date'>) => Promise<void>;
  read: (userId: string, notificationId: string) => Promise<boolean>;
}