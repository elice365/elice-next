// FLO 필터 컴포넌트 - KPOP/POP 카테고리 필터
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FLO_CATEGORIES, type FloCategoryType } from '@/constants/flo/categories';

interface FloFilterProps {
  selectedCategory: FloCategoryType;
  onCategoryChange: (category: FloCategoryType) => void;
  itemCounts: Record<FloCategoryType, number>;
  disabled?: boolean;
  className?: string;
}

export function FloFilter({
  selectedCategory,
  onCategoryChange,
  itemCounts,
  disabled = false,
  className = ''
}: FloFilterProps) {
  const t = useTranslations('flo');

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium mr-2 text-foreground/70">
        {t('filter.label', { default: '카테고리:' })}
      </span>
      
      <div className="flex gap-2 flex-wrap">
        {FLO_CATEGORIES.map((category) => (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            disabled={disabled}
            className={`px-3 py-1 rounded-[20px] text-sm font-medium border transition-all duration-200 whitespace-nowrap flex items-center gap-1 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              selectedCategory === category.key
                ? 'border-[var(--blog-accent)] text-white opacity-100'
                : 'border-[var(--border-color)] text-foreground opacity-80 hover:opacity-100 hover:border-[var(--border-color)]'
            }`}
            style={{
              ...(selectedCategory === category.key ? {
                background: 'var(--blog-accent)',
                borderColor: 'var(--blog-accent)'
              } : {
                background: 'var(--background)',
                borderColor: 'var(--border-color)'
              })
            }}
          >
            <span>{category.icon}</span>
            <span>{t(category.labelKey, { default: category.defaultLabel })}</span>
            <span 
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ 
                background: selectedCategory === category.key ? 'rgba(255,255,255,0.2)' : 'var(--background)',
                color: selectedCategory === category.key ? 'white' : 'var(--foreground)'
              }}
            >
              {itemCounts[category.key]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
