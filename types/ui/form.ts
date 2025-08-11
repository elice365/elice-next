// Form Component Type Definitions

// Generic form wrapper component
export interface FormWrapperProps {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

export interface FormInputProps {
  id?: string;
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

// Admin form field props (different from generic form field)
export interface AdminFormFieldProps {
  readonly field: import('../admin/admin').FormField;
  readonly value: any;
  readonly onChange: (name: string, value: any) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}