'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/fetch';
import type { NoticeItem, NoticeListResponse } from '@/types/notice';

export default function NoticePage() {
  const t = useTranslations('notice');
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await api.get<NoticeListResponse>(`/api/notice?page=${page}&limit=10`);
      
      if (response.data.success && response.data.data) {
        const responseData = response.data.data;
        let noticeData: NoticeItem[];
        let hasMore = false;
        
        if (Array.isArray(responseData)) {
          noticeData = responseData;
        } else {
          noticeData = responseData.notices || [];
          hasMore = responseData.hasMore || false;
        }
        
        setNotices(prev => page === 1 ? noticeData : [...prev, ...noticeData]);
        setHasMore(hasMore);
      }
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (noticeId: string) => {
    // Mark as read if user is logged in
    try {
      await api.post('/api/notice', { noticeId });
    } catch (error) {
      // Silently fail if not logged in - no logging needed for expected behavior
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
        
        <div className="space-y-4">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleNoticeClick(notice.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold">{notice.title}</h2>
                {notice.isImportant && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded">
                    {t('important')}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {notice.content}
              </p>
              
              {notice.link && (
                <a 
                  href={notice.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mb-4 block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('viewMore')}
                </a>
              )}
              
              <div className="flex items-center text-sm text-gray-500">
                <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{notice.author?.name || t('admin')}</span>
                {notice.readCount !== undefined && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{t('views')} {notice.readCount}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {notices.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500">
            {t('noNotices')}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full mt-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}