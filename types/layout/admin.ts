// Admin Layout Component Type Definitions

import { AdminPageState, AdminPageActions } from '@/hooks/admin/useAdminPage';

export interface StatCardConfig {
  title: string;
  value: number | string;
  change: {
    value: string;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  icon: string;
  variant: "primary" | "success" | "warning" | "info";
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text';
  icon?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface MobileAction {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success';
}

export interface AdminProps<T> {
  readonly title: string;
  readonly state: AdminPageState<T>;
  readonly actions: AdminPageActions;
  readonly stats?: readonly StatCardConfig[];
  readonly filters?: readonly FilterConfig[];
  readonly columns: any[];
  readonly actionButtons?: React.ReactNode;
  readonly mobileActions?: MobileAction[];
  readonly bulkActionButtons?: React.ReactNode;
  readonly onRowClick?: (record: T) => void;
  readonly rowKey?: string;
  readonly children?: React.ReactNode;
}