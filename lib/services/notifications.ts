import { Redis } from "@upstash/redis";
import { NotificationData, NotificationResponse } from "@/types/notifications";
import * as NotificationDB from "@/lib/db/notification";

// Redis 인스턴스
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Redis 키 패턴
const redisKey = (userId: string) => `notification:${userId}`;

// 단순화된 알림 서비스
class NotificationService {
  /**
   * 사용자 알림 조회 (캐시 우선 → DB 폴백)
   */
  async get(userId: string): Promise<NotificationResponse> {
    const key = redisKey(userId);

    try {
      // 1. Redis 캐시 조회
      const cached = await redis.get(key);
      if (cached && typeof cached === 'string') {
        return JSON.parse(cached) as NotificationResponse;
      }

      // 2. DB에서 조회
      const result = await this.getFromDB(userId);

      // 3. Redis에 캐시 (1시간 TTL)
      await redis.set(key, JSON.stringify(result), { ex: 3600 });

      return result;
    } catch (error) {
      console.error('알림 조회 오류:', error);
      throw new Error('알림을 가져올 수 없습니다');
    }
  }

  /**
   * 새 알림 추가 (DB 저장 → 캐시 업데이트)
   */
  async add(userId: string, data: Omit<NotificationData, 'id' | 'read' | 'date'>): Promise<void> {
    try {
      // 1. DB에 저장 (새로운 db 모듈 사용)
      await NotificationDB.createNotification({
        userId,
        category: data.type,
        title: data.title,
        content: data.content,
        link: data.link,
      });

      // 2. Redis 캐시 업데이트
      const key = redisKey(userId);
      const exists = await redis.exists(key);

      if (exists) {
        // 기존 캐시 무효화 (새로운 알림 추가 시)
        await redis.del(key);
      }
    } catch (error) {
      console.error('알림 추가 오류:', error);
      throw new Error('알림을 추가할 수 없습니다');
    }
  }

  /**
   * 알림 읽음 처리 (DB 업데이트 → 캐시 업데이트)
   */
  async read(userId: string, notificationId: string): Promise<boolean> {
    try {
      // 1. DB에서 읽음 처리 (새로운 db 모듈 사용)
      const updated = await NotificationDB.markNotificationAsRead(notificationId, userId);

      if (updated.count === 0) {
        // 공지사항 읽음 처리
        await NotificationDB.markNoticeAsRead(notificationId, userId);
      }

      // 2. Redis 캐시 무효화 (읽음 처리 시)
      const key = redisKey(userId);
      await redis.del(key);

      return true;
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return false;
    }
  }

  /**
   * DB에서 알림 데이터 조회
   */
  private async getFromDB(userId: string): Promise<NotificationResponse> {
    try {
      // 읽지 않은 개인 알림 조회 (새로운 db 모듈 사용)
      const notifications = await NotificationDB.findUnreadNotifications(userId);

      // 읽지 않은 공지사항 조회 (새로운 db 모듈 사용)
      const notices = await NotificationDB.findUnreadNotices(userId);

      // 형식 변환
      const notificationData: NotificationData[] = notifications.map((n: any) => ({
        type: n.category,
        id: n.uid,
        title: n.title,
        content: n.content,
        read: n.read,
        date: +n.createdTime,
        link: n.link,
      }));

      const noticeData: NotificationData[] = notices.map((n: any) => ({
        type: 'notice',
        id: n.uid,
        title: n.title,
        content: n.content,
        read: false,
        date: +n.createdTime,
        link: n.link,
      }));

      return {
        success: true,
        notifications: notificationData,
        notices: noticeData,
      };
    } catch (error) {
      console.error('DB 조회 오류:', error);
      return {
        success: false,
        notifications: [],
        notices: [],
      };
    }
  }
}

// 간단한 인터페이스 제공
const notificationService = new NotificationService();

export const notification = {
  get: (userId: string) => notificationService.get(userId),
  add: (userId: string, data: Omit<NotificationData, 'id' | 'read' | 'date'>) => 
    notificationService.add(userId, data),
  read: (userId: string, notificationId: string) => 
    notificationService.read(userId, notificationId),
};

export default notification;