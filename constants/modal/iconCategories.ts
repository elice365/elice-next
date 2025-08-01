/**
 * Icon categories for modal components
 * Used by RouterCreate and RouterEdit modals
 */
export const ICON_CATEGORIES = {
  navigation: [
    { name: 'Home', label: '홈' },
    { name: 'User', label: '사용자' },
    { name: 'Users', label: '사용자들' },
    { name: 'Settings', label: '설정' },
    { name: 'Search', label: '검색' },
    { name: 'Bell', label: '알림' },
    { name: 'Mail', label: '메일' },
    { name: 'MessageSquare', label: '메시지' }
  ],
  business: [
    { name: 'BarChart3', label: '차트' },
    { name: 'PieChart', label: '원형차트' },
    { name: 'TrendingUp', label: '트렌드' },
    { name: 'DollarSign', label: '달러' },
    { name: 'CreditCard', label: '카드' },
    { name: 'ShoppingCart', label: '쇼핑카트' },
    { name: 'Package', label: '패키지' },
    { name: 'Truck', label: '배송' }
  ],
  content: [
    { name: 'FileText', label: '문서' },
    { name: 'Image', label: '이미지' },
    { name: 'Video', label: '동영상' },
    { name: 'Music', label: '음악' },
    { name: 'Book', label: '책' },
    { name: 'Newspaper', label: '뉴스' },
    { name: 'Calendar', label: '달력' },
    { name: 'Clock', label: '시계' }
  ],
  system: [
    { name: 'Shield', label: '보안' },
    { name: 'Database', label: '데이터베이스' },
    { name: 'Server', label: '서버' },
    { name: 'Cpu', label: 'CPU' },
    { name: 'HardDrive', label: '하드드라이브' },
    { name: 'Wifi', label: '와이파이' },
    { name: 'Globe', label: '글로브' },
    { name: 'Zap', label: '번개' }
  ]
} as const;

export type IconCategory = keyof typeof ICON_CATEGORIES;