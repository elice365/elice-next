// 블로그 관련 상수
export const BLOG_DEFAULTS = {
  TYPE: 'post',
  STATUS: 'draft',
  TAGS: [] as string[]
} as const;

export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
} as const;

export const BLOG_TYPES = {
  POST: 'post',
  PAGE: 'page',
  ANNOUNCEMENT: 'announcement'
} as const;

// URL 슬러그 생성을 위한 정규식
export const URL_SLUG_REGEX = {
  NORMALIZE: /[^a-z0-9가-힣]+/g,
  TRIM: /(^-+)|(-+$)/g
} as const;

// 블로그 이미지 처리 관련
export const BLOG_IMAGES = {
  DEFAULT_SIZE: 350,
  FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  THUMBNAIL_SIZE: 200
} as const;