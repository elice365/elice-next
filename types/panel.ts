
export interface Router {
  name: string
  path: string
  icon?: string // 아이콘을 문자열로 변경
  auth?: boolean
  roles?: string[]
}

export interface PanelProps {
  router: Router[]
}

export interface PanelType {
  readonly type?: 'user' | 'admin';
}