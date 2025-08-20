// 관리자 유효성 검사 상수
export const USER_ALLOWED_FIELDS = [
  'name',
  'phoneNumber', 
  'status',
  'marketing',
  'terms'
] as const;

export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
] as const;

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024 // 100MB
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

export const MARKETING_STATUS = {
  AGREED: 'agreed',
  DISAGREED: 'disagreed',
  NOT_SET: 'not_set'
} as const;