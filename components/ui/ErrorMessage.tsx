import { Icon } from './Icon';
import type { ErrorMessageProps } from '@/types/ui';

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18
};

export function ErrorMessage({ 
  error, 
  icon = 'AlertCircle',
  size = 'md',
  className = ''
}: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-2 text-red-600 ${sizeClasses[size]} ${className}`}>
      <Icon name={icon} size={iconSizes[size]} />
      <span>{error}</span>
    </div>
  );
}

export default ErrorMessage;