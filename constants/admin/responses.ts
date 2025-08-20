// 관리자 API 응답 메시지 상수
export const ADMIN_MESSAGES = {
  // Blog
  BLOG_CREATED: '블로그 글이 생성되었습니다.',
  BLOG_UPDATED: '블로그 글이 수정되었습니다.',
  BLOG_DELETED: '블로그 글이 삭제되었습니다.',
  BLOG_BULK_DELETED: (count: number) => `${count}개의 글이 삭제되었습니다.`,
  BLOG_LIST_ERROR: '블로그 목록 조회 실패',
  BLOG_CREATE_ERROR: '블로그 글 생성 실패',
  BLOG_UPDATE_ERROR: '블로그 글 수정 실패',
  BLOG_DELETE_ERROR: '블로그 글 삭제 실패',

  // User  
  USER_UPDATED: '사용자 정보가 수정되었습니다.',
  USER_DELETED: '사용자가 삭제되었습니다.',
  USER_LIST_ERROR: '사용자 목록 조회 실패',
  USER_UPDATE_ERROR: '사용자 정보 수정 실패',

  // Role
  ROLE_CREATED: '역할이 생성되었습니다.',
  ROLE_UPDATED: '역할이 수정되었습니다.',
  ROLE_DELETED: '역할이 삭제되었습니다.',
  ROLE_LIST_ERROR: '역할 목록 조회 실패',

  // Session
  SESSION_CREATED: '세션이 생성되었습니다.',
  SESSION_DELETED: '세션이 삭제되었습니다.',
  SESSION_CLEANUP: (count: number) => `${count}개의 만료된 세션이 정리되었습니다.`,
  SESSION_LIST_ERROR: '세션 목록 조회 실패',

  // Notification
  NOTIFICATION_CREATED: '알림이 생성되었습니다.',
  NOTIFICATION_UPDATED: '알림이 수정되었습니다.',
  NOTIFICATION_DELETED: '알림이 삭제되었습니다.',
  NOTIFICATION_LIST_ERROR: '알림 목록 조회 실패',

  // Category
  CATEGORY_CREATED: '카테고리가 생성되었습니다.',
  CATEGORY_UPDATED: '카테고리가 수정되었습니다.',
  CATEGORY_DELETED: '카테고리가 삭제되었습니다.',
  CATEGORY_LIST_ERROR: '카테고리 목록 조회 실패',

  // Generic
  SERVER_ERROR: '서버 오류가 발생했습니다',
  INVALID_FIELD: '필수 필드가 누락되었습니다',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
  UNAUTHORIZED: '권한이 없습니다',
  FORBIDDEN: '접근이 금지되었습니다'
} as const;

export const ADMIN_SUCCESS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204
} as const;

export const ADMIN_ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;