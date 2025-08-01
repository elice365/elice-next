import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { notification } from '@/lib/services/notifications';
import { APIResult, AuthInfo } from '@/types/api';
import { NotificationResponse } from '@/types/notifications';

// GET /api/notification - 알림 조회
async function getNotifications(
  request: NextRequest, 
  context: AuthInfo
): Promise<APIResult<NotificationResponse>> {
  try {
    const userId = context.userId!;
    const result = await notification.get(userId);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('GET /api/notification 오류:', error);
    return {
      success: false,
      message: 'Failed to fetch notifications'
    };
  }
}

// POST /api/notification - 알림 읽기 또는 알림 생성
async function handleNotificationAction(
  request: NextRequest, 
  context: AuthInfo
): Promise<APIResult<{ success: boolean; message: string }>> {
  try {
    const userId = context.userId!;
    const body = await request.json();
    
    // 읽음 처리
    if (body.type === 'read') {
      const { id } = body;
      
      if (!id) {
        return {
          success: false,
          message: 'Notification ID is required'
        };
      }
      
      const success = await notification.read(userId, id);
      
      return {
        success: true,
        data: {
          success,
          message: success ? 'Notification marked as read' : 'Failed to mark as read'
        }
      };
    }
    
    // 알림 생성 (관리자 또는 시스템용)
    if (body.type === 'create') {
      const { targetUserId, category, title, content, link } = body;
      
      if (!title || !content) {
        return {
          success: false,
          message: 'Title and content are required'
        };
      }
      
      await notification.add(targetUserId || userId, {
        type: category || 'notification',
        title,
        content,
        link
      });
      
      return {
        success: true,
        data: {
          success: true,
          message: 'Notification created successfully'
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid request type'
    };
  } catch (error) {
    console.error('POST /api/notification 오류:', error);
    return {
      success: false,
      message: 'Failed to process notification request'
    };
  }
}

export const GET = handler(getNotifications, {
  auth: true,
  limit: true
});

export const POST = handler(handleNotificationAction, {
  auth: true,
  limit: true
});