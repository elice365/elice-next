// Provider Component Type Definitions

import type { User } from '../auth/auth';

// Auth Provider Props
export interface AuthProps {
  /** Server-side authentication data passed from layout */
  readonly AuthData: Awaited<ReturnType<typeof import('../../lib/server/auth').UserInfo>>;
  /** Child components that will have access to authentication context */
  readonly children: React.ReactNode;
}

// App Root Provider Props  
export interface AppProps {
  readonly children: React.ReactNode;
  readonly type: "admin" | "user";
}