// UI Component Type Definitions

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