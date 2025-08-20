// React Hook - FLO 상세 데이터 관리
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FloContentType, FloDetailData, FloUnifiedItem } from '@/types/flo';
import apiUtils from '@/lib/api';
import { logger } from '@/utils/logger';

interface UseFloDetailProps {
  initialData?: FloDetailData | null;
}

interface UseFloDetailReturn {
  detailData: FloDetailData | null;
  loading: boolean;
  error: string | null;
  fetchDetail: (type: FloContentType, id: number) => Promise<void>;
  clearDetail: () => void;
  retry: () => void;
}

export function useFloDetail(props: UseFloDetailProps = {}): UseFloDetailReturn {
  const { initialData = null } = props;
  
  const [detailData, setDetailData] = useState<FloDetailData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{ type: FloContentType; id: number } | null>(null);

  const fetchDetail = useCallback(async (type: FloContentType, id: number) => {
    if (!type || !id) {
      setError('Invalid type or ID');
      return;
    }

    setLoading(true);
    setError(null);
    setLastRequest({ type, id });

    try {
      const result = await apiUtils.get(`/api/flo/detail/${type}/${id}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch detail data');
      }

      setDetailData(result.data as FloDetailData);
      setError(null);

    } catch (err) {
      logger.flo.error('Error fetching FLO detail', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => {
    setDetailData(null);
    setError(null);
    setLastRequest(null);
  }, []);

  const retry = useCallback(() => {
    if (lastRequest) {
      fetchDetail(lastRequest.type, lastRequest.id);
    }
  }, [lastRequest, fetchDetail]);

  return {
    detailData,
    loading,
    error,
    fetchDetail,
    clearDetail,
    retry
  };
}

// 카드 클릭 시 상세 데이터를 가져오는 헬퍼 훅
export function useFloCardClick() {
  const { fetchDetail, detailData, loading, error } = useFloDetail();

  const handleCardClick = useCallback(async (item: FloUnifiedItem) => {
    if (!item.id || !item.type) {
      console.warn('Invalid item data for detail fetch:', item);
      return;
    }

    await fetchDetail(item.type, item.id);
  }, [fetchDetail]);

  return {
    handleCardClick,
    detailData,
    loading,
    error
  };
}

// 특정 타입과 ID로 상세 데이터를 즉시 가져오는 훅
export function useFloDetailById(type: FloContentType, id: number, autoFetch = true) {
  const { detailData, loading, error, fetchDetail, retry } = useFloDetail();

  useEffect(() => {
    if (autoFetch && type && id) {
      fetchDetail(type, id);
    }
  }, [type, id, autoFetch, fetchDetail]);

  return {
    detailData,
    loading,
    error,
    retry,
    refetch: () => fetchDetail(type, id)
  };
}