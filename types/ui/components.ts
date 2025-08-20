// UI Component Type Definitions
import type { FloContentType, FloUnifiedItem } from '../flo';

// Common UI component props

export interface ErrorMessageProps {
  error: string | null | undefined;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  color?: 'white' | 'primary' | 'gray';
}


export interface WindowLinkProps {
  link: string;
  type?: "popup" | "newTab";
  size?: "small" | "medium" | "large" | { width: number; height: number };
  children: React.ReactNode;
  className?: string;
}

// Floating Action Button Types
export interface ActionItem {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success';
}

export interface FloatingActionButtonProps {
  actions: ActionItem[];
  mainIcon?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  hideOnDesktop?: boolean;
}

export interface MobileActionBarProps {
  actions: ActionItem[];
  visible?: boolean;
}

// FLO 페이지 props
export interface FloProps {
  initialData?: FloUnifiedItem[];
  initialType?: FloContentType;
}