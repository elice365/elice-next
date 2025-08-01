/**
 * Blog Module Constants
 * Common constants used across blog components
 */

// Default values
export const DEFAULT_POST_IMAGE = "https://placehold.co/350x200.png";
export const DEFAULT_AUTHOR_IMAGE = "https://placehold.co/100x100.png";
export const DEFAULT_POSTS_PER_PAGE = 12;
export const DEFAULT_RELATED_POSTS_COUNT = 3;

// Layout options
export const BLOG_LAYOUTS = {
  CARD: 'card',
  LIST: 'list'
} as const;

export type BlogLayout = typeof BLOG_LAYOUTS[keyof typeof BLOG_LAYOUTS];

// View options
export const VIEW_TYPES = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet'
} as const;

export type ViewType = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];

// Sort options
export const SORT_OPTIONS = {
  LATEST: 'latest',
  POPULAR: 'popular',
  TRENDING: 'trending',
  OLDEST: 'oldest'
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

// Animation constants
export const ANIMATION_DURATION = {
  FAST: 0.3,
  NORMAL: 0.6,
  SLOW: 0.8
} as const;

export const SPRING_CONFIG = {
  DEFAULT: { type: "spring", stiffness: 400, damping: 30 },
  BOUNCY: { type: "spring", stiffness: 400, damping: 17 },
  SMOOTH: { type: "spring", stiffness: 300, damping: 20 }
} as const;

// Breakpoint constants
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280
} as const;

// Content parsing
export const CONTENT_SECTION_TYPES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  HIGHLIGHT: 'highlight'
} as const;

export type ContentSectionType = typeof CONTENT_SECTION_TYPES[keyof typeof CONTENT_SECTION_TYPES];

// Engagement actions
export const ENGAGEMENT_ACTIONS = {
  LIKE: 'like',
  BOOKMARK: 'bookmark',
  SHARE: 'share',
  COMMENT: 'comment'
} as const;

export type EngagementAction = typeof ENGAGEMENT_ACTIONS[keyof typeof ENGAGEMENT_ACTIONS];

// Social share platforms
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  KAKAO: 'kakao'
} as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS];

// Blog API endpoints
export const BLOG_API_ENDPOINTS = {
  POSTS: '/api/post',
  LIKE: '/api/post/like',
  BOOKMARK: '/api/post/bookmark',
  COMMENT: '/api/post/comment',
  VIEW: '/api/post/view'
} as const;

// Error messages
export const BLOG_ERROR_MESSAGES = {
  LOAD_FAILED: '포스트를 불러오는데 실패했습니다.',
  LIKE_FAILED: '좋아요 처리에 실패했습니다.',
  BOOKMARK_FAILED: '북마크 처리에 실패했습니다.',
  COMMENT_FAILED: '댓글 작성에 실패했습니다.',
  SHARE_FAILED: '공유하기에 실패했습니다.'
} as const;

// Success messages
export const BLOG_SUCCESS_MESSAGES = {
  LIKED: '좋아요를 눌렀습니다.',
  UNLIKED: '좋아요를 취소했습니다.',
  BOOKMARKED: '북마크에 추가했습니다.',
  UNBOOKMARKED: '북마크에서 제거했습니다.',
  COMMENTED: '댓글이 작성되었습니다.',
  SHARED: '성공적으로 공유되었습니다.'
} as const;