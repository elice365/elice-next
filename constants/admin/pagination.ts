// 관리자 페이지네이션 관련 상수
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  SORT_BY: 'createdTime',
  SORT_ORDER: 'desc' as 'asc' | 'desc'
} as const;

export const PAGINATION_LIMITS = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 10
} as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = typeof SORT_ORDERS[number];

export const BLOG_SORT_FIELDS = [
  'createdTime',
  'updateTime',
  'publishedAt',
  'title',
  'views',
  'likeCount'
] as const;

export const USER_SORT_FIELDS = [
  'createdTime',
  'updateTime',
  'lastLoginTime',
  'email',
  'name',
  'status'
] as const;