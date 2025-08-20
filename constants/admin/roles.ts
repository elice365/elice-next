// 관리자 역할(Role) 관련 상수
export const SYSTEM_ROLES = ['admin', 'user'] as const;

export const ROLE_PERMISSIONS = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const ROLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

// 역할 검증 함수
export function isSystemRole(roleName: string): boolean {
  return SYSTEM_ROLES.includes(roleName.toLowerCase() as any);
}

export function isDeletableRole(roleName: string): boolean {
  return !isSystemRole(roleName);
}