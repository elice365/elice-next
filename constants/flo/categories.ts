// FLO 카테고리 필터 상수
export type FloCategoryType = 'ALL' | 'KPOP' | 'POP';

export interface FloCategory {
  key: FloCategoryType;
  labelKey: string;
  defaultLabel: string;
  icon: string;
}

export const FLO_CATEGORIES: FloCategory[] = [
  {
    key: 'ALL',
    labelKey: 'filter.all',
    defaultLabel: '전체',
    icon: '🌟'
  },
  {
    key: 'KPOP',
    labelKey: 'filter.kpop',
    defaultLabel: 'K-POP',
    icon: '🇰🇷'
  },
  {
    key: 'POP',
    labelKey: 'filter.pop',
    defaultLabel: 'POP',
    icon: '🌎'
  }
];

// 기본 카테고리
export const DEFAULT_CATEGORY: FloCategoryType = 'ALL';

// 필터가 지원되는 콘텐츠 타입
export const FILTERABLE_CONTENT_TYPES = ['new-rank'] as const;