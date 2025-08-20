// React Hook - 트랙 뷰 상태 관리 (모달 대신 테이블 뷰)
'use client';

import { useState, useCallback } from 'react';
import type { FloUnifiedItem } from '@/types/flo';
import { useFloDetail } from './useFloDetail';

export function useTrackView() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedItem, setSelectedItem] = useState<FloUnifiedItem | null>(null);
  const { detailData, loading, error, fetchDetail } = useFloDetail();

  const showCardView = useCallback(() => {
    setViewMode('cards');
    setSelectedItem(null);
  }, []);

  const showTableView = useCallback(async (item: FloUnifiedItem) => {
    setSelectedItem(item);
    setViewMode('table');
    
    // 상세 데이터 가져오기
    if (item.id && item.type) {
      await fetchDetail(item.type, item.id);
    }
  }, [fetchDetail]);

  const toggleView = useCallback(() => {
    if (viewMode === 'cards') {
      // 카드 뷰에서는 아이템이 선택되어야 테이블 뷰로 전환 가능
      return;
    } else {
      showCardView();
    }
  }, [viewMode, showCardView]);

  return {
    viewMode,
    selectedItem,
    detailData,
    loading,
    error,
    showCardView,
    showTableView,
    toggleView,
    isTableView: viewMode === 'table',
    isCardView: viewMode === 'cards',
  };
}