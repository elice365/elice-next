// Auth Hook Type Definitions

import { AuthFormField } from '@/types/auth';

export interface UseAuthFormStateProps {
  readonly fields: readonly AuthFormField[];
}

export interface UseAuthFormValidationProps {
  readonly fields: readonly AuthFormField[];
  readonly validate?: (data: Record<string, string>) => string | null;
}

export interface UseAuthFormSubmissionProps {
  readonly title: string;
  readonly successRedirect?: string;
  readonly onSuccess?: () => void;
}

export interface TokenRefreshOptions {
  // Activity detection settings
  enabled?: boolean;
  debounceTime?: number; // Time to wait after activity before refresh (ms)
  refreshBeforeExpiry?: number; // Time before expiry to trigger refresh (ms)
  activityEvents?: string[]; // Events to monitor for activity
  enableVisibilityRefresh?: boolean; // Refresh on tab focus
}