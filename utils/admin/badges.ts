/**
 * 관리자 페이지에서 사용되는 공통 배지 스타일 유틸리티
 */

export interface BadgeStyleConfig {
  bg: string;
  text: string;
  shadow?: string;
}

export interface BadgeConfig {
  [key: string]: BadgeStyleConfig;
}

// 역할 배지 스타일
export const roleBadgeStyles: BadgeConfig = {
  admin: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    shadow: 'shadow-red-500/20'
  },
  user: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
    shadow: 'shadow-blue-500/20'
  },
  public: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    shadow: 'shadow-green-500/20'
  },
  default: {
    bg: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-800 dark:text-gray-200',
    shadow: 'shadow-gray-500/20'
  }
};

// 상태 배지 스타일
export const statusBadgeStyles: BadgeConfig = {
  active: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    shadow: 'shadow-green-500/20'
  },
  inactive: {
    bg: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-800 dark:text-gray-200',
    shadow: 'shadow-gray-500/20'
  },
  suspended: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    shadow: 'shadow-red-500/20'
  },
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
    shadow: 'shadow-yellow-500/20'
  }
};

// 아이콘 매핑
export const roleIcons: Record<string, string> = {
  admin: 'Crown',
  user: 'User',
  public: 'Globe',
  default: 'Shield'
};

export const statusIcons: Record<string, string> = {
  active: 'CheckCircle',
  inactive: 'Clock',
  suspended: 'XCircle',
  pending: 'Timer'
};

// 텍스트 매핑
export const roleTexts: Record<string, string> = {
  admin: '관리자',
  user: '사용자',
  public: '공개'
};

export const statusTexts: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
  pending: '대기'
};

/**
 * 배지 스타일을 가져오는 함수
 */
export function getBadgeStyle(type: 'role' | 'status', value: string): string {
  const styles = type === 'role' ? roleBadgeStyles : statusBadgeStyles;
  const style = styles[value.toLowerCase()] || styles.default;
  
  return `${style.bg} ${style.text} ${style.shadow || ''}`;
}

/**
 * 아이콘을 가져오는 함수
 */
export function getBadgeIcon(type: 'role' | 'status', value: string): string {
  const icons = type === 'role' ? roleIcons : statusIcons;
  return icons[value.toLowerCase()] || icons.default;
}

/**
 * 텍스트를 가져오는 함수
 */
export function getBadgeText(type: 'role' | 'status', value: string): string {
  const texts = type === 'role' ? roleTexts : statusTexts;
  return texts[value.toLowerCase()] || value;
}