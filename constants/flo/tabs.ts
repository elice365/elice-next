// FLO 탭 설정 상수
import type { FloContentType } from '@/types/flo';

export interface FloTab {
  type: FloContentType;
  icon: string;
  labelKey: string;
  defaultLabel: string;
}

export const FLO_TABS: FloTab[] = [
  {
    type: 'new-music',
    icon: '🎵',
    labelKey: 'tabs.newMusic',
    defaultLabel: '최신 음악'
  },
  {
    type: 'contents',
    icon: '📻',
    labelKey: 'tabs.contents',
    defaultLabel: '큐레이션'
  },
  {
    type: 'genres',
    icon: '🎼',
    labelKey: 'tabs.genres',
    defaultLabel: '장르별'
  },
  {
    type: 'editors-pick',
    icon: '✨',
    labelKey: 'tabs.editorsPick',
    defaultLabel: '에디터 픽'
  },
  {
    type: 'healing',
    icon: '🧘',
    labelKey: 'tabs.healing',
    defaultLabel: '힐링'
  }
];

// 탭 순서 (우선순위)
export const TAB_ORDER: FloContentType[] = [
  'new-music',
  'contents',
  'genres',
  'editors-pick',
  'healing'
];

// 기본 탭
export const DEFAULT_TAB: FloContentType = 'new-music';