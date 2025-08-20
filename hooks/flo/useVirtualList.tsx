// 가상화 리스트 훅 - 대용량 데이터 렌더링 최적화
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseVirtualListOptions {
  itemHeight: number | ((index: number) => number); // 고정 또는 동적 높이
  overscan?: number; // 뷰포트 외부에 미리 렌더링할 아이템 수
  estimatedItemHeight?: number; // 동적 높이일 때 예상 높이
  getKey?: (index: number) => string | number; // 아이템 키 생성 함수
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
  key: string | number;
}

export function useVirtualList<T>(
  items: T[],
  containerHeight: number,
  options: UseVirtualListOptions
) {
  const {
    itemHeight,
    overscan = 3,
    estimatedItemHeight = 50,
    getKey = (index) => index
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const measuredHeights = useRef<Map<number, number>>(new Map());
  
  // 아이템 높이 계산
  const getItemHeight = useCallback((index: number) => {
    if (typeof itemHeight === 'function') {
      // 측정된 높이가 있으면 사용, 없으면 계산
      return measuredHeights.current.get(index) || itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  // 현재 보이는 아이템 범위 계산
  const visibleRange = useMemo(() => {
    if (!containerHeight || items.length === 0) {
      return { start: 0, end: 0 };
    }

    let accumulatedHeight = 0;
    let start = 0;
    let end = items.length - 1;

    // 시작 인덱스 찾기
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // 끝 인덱스 찾기
    accumulatedHeight = 0;
    for (let i = start; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    return { start, end };
  }, [scrollTop, containerHeight, items.length, getItemHeight, overscan]);

  // 가상 아이템 목록 생성
  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];
    let offset = 0;

    // 시작 인덱스까지의 오프셋 계산
    for (let i = 0; i < visibleRange.start; i++) {
      offset += getItemHeight(i);
    }

    // 보이는 아이템들 생성
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const size = getItemHeight(i);
      items.push({
        index: i,
        start: offset,
        end: offset + size,
        size,
        key: getKey(i)
      });
      offset += size;
    }

    return items;
  }, [visibleRange, getItemHeight, getKey]);

  // 스크롤 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  // 특정 인덱스로 스크롤
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }

    scrollElementRef.current.scrollTo({
      top: offset,
      behavior
    });
  }, [getItemHeight]);

  // 아이템 높이 측정 (동적 높이용)
  const measureItem = useCallback((index: number, height: number) => {
    const prevHeight = measuredHeights.current.get(index);
    if (prevHeight !== height) {
      measuredHeights.current.set(index, height);
      // 높이가 변경되면 리렌더링 트리거
      setScrollTop((prev) => prev);
    }
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollTop,
    handleScroll,
    scrollToIndex,
    measureItem,
    scrollElementRef,
    visibleRange
  };
}

// 가상화 리스트 컨테이너 컴포넌트
interface VirtualListContainerProps {
  height: number;
  totalHeight: number;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  className?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export const VirtualListContainer: React.FC<VirtualListContainerProps> = ({
  height,
  totalHeight,
  onScroll,
  children,
  className = '',
  scrollRef
}) => {
  return (
    <div
      ref={scrollRef}
      className={'overflow-auto ' + className}
      style={{ height }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

// 가상화 아이템 래퍼 컴포넌트
interface VirtualItemWrapperProps {
  item: VirtualItem;
  children: React.ReactNode;
  onMeasure?: (index: number, height: number) => void;
}

export const VirtualItemWrapper: React.FC<VirtualItemWrapperProps> = ({
  item,
  children,
  onMeasure
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onMeasure && elementRef.current) {
      const height = elementRef.current.getBoundingClientRect().height;
      if (height !== item.size) {
        onMeasure(item.index, height);
      }
    }
  }, [item, onMeasure]);

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        top: item.start,
        left: 0,
        right: 0,
        height: onMeasure ? 'auto' : item.size
      }}
      data-index={item.index}
    >
      {children}
    </div>
  );
};