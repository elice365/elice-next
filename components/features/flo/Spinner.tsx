'use client';

import { LoadingSpinnerProps } from '@/types/ui';
import React from 'react';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text = '로딩 중...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text}
      />
      {text && (
        <p className="mt-4 text-slate-600 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

