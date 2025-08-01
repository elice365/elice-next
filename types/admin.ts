// Shared types for admin pages and components
import { Field } from '@/utils/regex/input';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  validation?: ValidationRule[];
  options?: { value: string; label: string; description?: string }[];
  defaultValue?: any;
  required?: boolean;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface FormErrors {
  [key: string]: string;
}

// Modal states
export interface ModalStates {
  create: boolean;
  edit: boolean;
  delete: boolean;
  [key: string]: boolean;
}

// Role entity
export interface Role {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  createdTime: string;
  updateTime: string;
}

// Common response types
export interface RoleResponse {
  roles: Role[];
  pagination: PaginationState;
}

// Stats types
export interface RoleStats {
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    userCount: number;
  }>;
  totalRoles: number;
  totalUserRoles: number;
}

// Router entity
export interface WebRouter {
  uid: string;
  name: string;
  path: string;
  icon: string;
  role: string[];
  createdTime: string;
  updateTime: string;
}

export interface RouterResponse {
  routers: WebRouter[];
  pagination: PaginationState;
}
export interface RouterStats {
  totalRouters: number;
  adminRouters: number;
  userRouters: number;
  publicRouters: number;
}

// Form field configurations for admin entities
export interface AdminFormConfig {
  role: {
    name: { field: Field; required: boolean };
    description: { field: Field; required: boolean };
  };
  router: {
    name: { field: Field; required: boolean };
    path: { field: Field; required: boolean };
    icon: { field: Field; required: boolean };
    role: { required: boolean };
  };
}

// Common admin entity type
export type AdminEntity = Role | WebRouter;

// Badge style configurations
export interface BadgeStyles {
  [key: string]: string;
}

// Common admin page props
export interface AdminPageProps<T> {
  endpoint: string;
  entityName: string;
  createFields: Field[];
  editFields?: Field[];
  searchFields?: Field[];
  filterFields?: string[];
}