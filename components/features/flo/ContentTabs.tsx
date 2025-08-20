// FLO 콘텐츠 탭 컴포넌트
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FLO_TABS } from '@/constants/flo/tabs';
import type { FloContentType } from '@/types/flo';

interface FloContentTabsProps {
  activeTab: FloContentType;
  onTabChange: (type: FloContentType) => void;
  className?: string;
}

export function FloContentTabs({ activeTab, onTabChange, className = '' }: FloContentTabsProps) {
  const t = useTranslations('flo');

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex gap-1 py-2 min-w-max">
        {FLO_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => onTabChange(tab.type)}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ease-in-out relative flex items-center gap-2 ${
              activeTab === tab.type 
                ? 'bg-background border-2 text-foreground' 
                : 'bg-transparent border-2 border-transparent text-foreground/70 hover:bg-background/50 hover:text-foreground'
            }`}
            style={{ 
              ...(activeTab === tab.type ? { 
                borderColor: 'var(--border-color)',
                color: 'var(--blog-accent)'
              } : {})
            }}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{t(tab.labelKey, { default: tab.defaultLabel })}</span>
            {activeTab === tab.type && (
              <span 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[30%] h-[3px] rounded-t-[3px]"
                style={{ background: 'var(--blog-accent)' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
