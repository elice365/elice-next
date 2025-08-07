"use client";

import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";

interface NotificationData {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  category: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  readTime?: string;
  createdTime: string;
}

interface NotificationViewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly notification: NotificationData | null;
}

export function NotificationViewModal({ isOpen, onClose, notification }: NotificationViewModalProps) {
  if (!notification) return null;

  const categoryMap: Record<string, { label: string; color: string; icon: string }> = {
    system: { label: '시스템', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔧' },
    notice: { label: '공지사항', color: 'bg-blue-100 text-blue-700 border-[var(--border-color)] ', icon: '📢' },
    payment: { label: '결제', color: 'bg-green-100 text-green-700 border-green-200', icon: '💳' },
    notification: { label: '일반', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📬' }
  };

  const categoryConfig = categoryMap[notification.category] || categoryMap.notification;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const createdDate = formatDate(notification.createdTime);
  const readDate = notification.readTime ? formatDate(notification.readTime) : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="알림 상세보기"
      subtitle="알림의 상세 정보를 확인합니다"
      icon="Eye"
      iconColor="text-blue-600"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* 헤더 정보 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
              {notification.user?.name?.[0] || notification.user?.email?.[0] || '?'}
            </div>
            <div>
              <div className="font-medium text-[var(--text-color)]">
                {notification.user?.name || 'Unknown User'}
              </div>
              <div className="text-sm text-[var(--text-color)] opacity-60">
                {notification.user?.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${categoryConfig.color}`}>
              {categoryConfig.icon} {categoryConfig.label}
            </span>
            {notification.read ? (
              <Badge className="bg-green-100 text-green-700 border border-green-200">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                읽음
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
                <Icon name="Clock" size={12} className="mr-1" />
                읽지 않음
              </Badge>
            )}
          </div>
        </div>

        {/* 알림 내용 */}
        <div className="bg-[var(--color-panel)] rounded-lg p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            {notification.title}
          </h3>
          <div className="text-[var(--text-color)] leading-relaxed whitespace-pre-wrap">
            {notification.content}
          </div>
          
          {notification.link && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Icon name="Link" size={16} className="text-blue-600" />
                <span className="text-sm text-[var(--text-color)] opacity-70">링크:</span>
              </div>
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline text-sm mt-1 block"
              >
                {notification.link}
              </a>
            </div>
          )}
        </div>

        {/* 메타데이터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--modal-header-bg)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Calendar" size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-[var(--text-color)]">생성일</span>
            </div>
            <div className="text-[var(--text-color)]">{createdDate.date}</div>
            <div className="text-sm text-[var(--text-color)] opacity-60">{createdDate.time}</div>
          </div>

          <div className="bg-[var(--modal-header-bg)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={notification.read ? "CheckCircle" : "Clock"} size={16} className={notification.read ? "text-green-500" : "text-orange-500"} />
              <span className="text-sm font-medium text-[var(--text-color)]">읽음 상태</span>
            </div>
            {notification.read && readDate ? (
              <>
                <div className="text-[var(--text-color)]">{readDate.date}</div>
                <div className="text-sm text-[var(--text-color)] opacity-60">{readDate.time}</div>
              </>
            ) : (
              <div className="text-[var(--text-color)]">읽지 않음</div>
            )}
          </div>
        </div>

        {/* 알림 ID (개발자용) */}
        <div className="bg-[var(--modal-header-bg)] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-color)] opacity-50">알림 ID</span>
            <code className="text-xs font-mono text-[var(--text-color)] opacity-70 bg-[var(--color-panel)] px-2 py-1 rounded">
              {notification.id}
            </code>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="X" size={16} />
            닫기
          </button>
        </div>
      </div>
    </BaseModal>
  );
}