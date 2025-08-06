"use client";

import { memo, useCallback, useMemo } from "react";
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Dropdown } from '@/components/ui/Dropdown';
import { useMounted } from "@/hooks/utils";
import { useAuth } from '@/hooks/auth';
import { api } from '@/lib/fetch';
import { NotificationResponse, NotificationData } from "@/types/notifications";
import { Translated } from "@/components/i18n/Translated";

// Fetcher function for SWR using api.get
const fetcher = async (url: string): Promise<NotificationResponse> => {
    const { data } = await api.get<any>(url);
    // API 응답이 이중 감싸기 구조인 경우 처리
    return data.data || data;
};

export default memo(function Notification() {
    const mounted = useMounted();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const messages = Translated("messages",'notificationsNull');

    // Use SWR to fetch notifications with periodic updates
    const { data, mutate } = useSWR(
        isAuthenticated ? '/api/notification' : null,
        fetcher,
        {
            refreshInterval: 30000, // Refresh every 30 seconds
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
        }
    );

    // Combine notifications and notices into a single array
    const notifications = useMemo(() => {
        if (!data?.success) return [];
        
        const all: NotificationData[] = [
            ...(data.notifications || []),
            ...(data.notices || [])
        ];
        
        // Sort by date (newest first)
        return all.sort((a, b) => b.date - a.date);
    }, [data]);

    // Handle notification click - mark as read and navigate
    const read = useCallback(async (notificationId: string) => {
        // Don't do anything for empty notification placeholder
        if (notificationId === 'empty') return;
        
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return;

        try {
            // Mark notification as read using unified API
            await api.post('/api/notification', { 
                type: 'read',
                select: notification.type === 'notice' ? 'notice' : 'notification',
                id: notificationId 
            });

            // Refresh notifications data
            mutate();

            // Navigate to appropriate page based on type and link
            if (notification.link) {
                router.push(notification.link);
            } else {
                // Route based on notification type
                switch (notification.type) {
                    case 'notice':
                        router.push(`/notice/${notificationId}`);
                        break;
                    case 'payment':
                        router.push(`/payment/${notificationId}`);
                        break;
                    case 'notification':
                    case 'system':
                    default:
                        // For general notifications, redirect to a notification detail page or dashboard
                        router.push(`/notification/${notificationId}`);
                        break;
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [notifications, mutate, router]);

    // Format notifications for dropdown
    const options = useMemo(() => 
        notifications.length > 0 
            ? notifications.map(notification => ({
                key: notification.id,
                label: notification.title,
                content: notification.content,
                date: new Date(notification.date)
            }))
            : [{
                key: 'empty',
                label: messages,
                content: '',
                date: new Date()
            }],
        [notifications, messages]
    );

    // Don't render if not mounted or not authenticated
    if (!mounted || !isAuthenticated || !user) return null;

    const notificationCount = notifications.length;

    return (
        <div className="relative">
            <Dropdown
                currentIcon="Bell"
                options={options}
                direction="right-0"
                className="opacity-55"
                onSelect={read}
                ariaLabel="notifications"
            />
            {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </div>
            )}
        </div>
    );
});