// 관리자 캐시 키 상수
export const ADMIN_CACHE_KEYS = {
  ROUTER: {
    ADMIN: 'router:admin',
    USER: 'router:user',
    ALL: ['router:admin', 'router:user']
  },
  BLOG: {
    LIST: 'blog:list',
    DETAIL: (uid: string) => `blog:detail:${uid}`,
    TRANSLATIONS: (uid: string) => `blog:translations:${uid}`,
    IMAGES: (uid: string) => `blog:images:${uid}`
  },
  USER: {
    LIST: 'user:list',
    DETAIL: (id: string) => `user:detail:${id}`,
    ROLES: (id: string) => `user:roles:${id}`
  },
  ROLE: {
    LIST: 'role:list',
    DETAIL: (id: string) => `role:detail:${id}`
  },
  NOTIFICATION: {
    LIST: 'notification:list',
    DETAIL: (id: string) => `notification:detail:${id}`
  }
} as const;

// 캐시 TTL 설정 (초)
export const CACHE_TTL = {
  SHORT: 300,    // 5분
  MEDIUM: 1800,  // 30분
  LONG: 3600,    // 1시간
  VERY_LONG: 86400 // 24시간
} as const;