import type { LoadingSpinnerProps } from '@/types/ui';

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6'
};

const colorClasses = {
  white: 'border-white',
  primary: 'border-blue-600',
  gray: 'border-gray-600'
};

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '',
  color = 'white' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]}`}
        aria-label="Loading"
      />
      {text && <span>{text}</span>}
    </div>
  );
}

export default LoadingSpinner;