"use client";

import { memo } from "react";
import { Icon } from "../Icon";
import type { StatTrend , StatCardProps } from "@/types/ui/card";

const variantStyles = {
    primary: {
        container: 'border-l-4 border-l-blue-500 shadow-sm hover:shadow-md',
        icon: 'text-blue-500',
        accent: 'bg-blue-50 dark:bg-blue-900/20'
    },
    success: {
        container: 'border-l-4 border-l-green-500 shadow-sm hover:shadow-md',
        icon: 'text-green-500',
        accent: 'bg-green-50 dark:bg-green-900/20'
    },
    warning: {
        container: 'border-l-4 border-l-orange-500 shadow-sm hover:shadow-md',
        icon: 'text-orange-500',
        accent: 'bg-orange-50 dark:bg-orange-900/20'
    },
    info: {
        container: 'border-l-4 border-l-purple-500 shadow-sm hover:shadow-md',
        icon: 'text-purple-500',
        accent: 'bg-purple-50 dark:bg-purple-900/20'
    }
};

export const StatCard = memo(function StatCard({
    title,
    value,
    change,
    icon,
    variant = 'primary',
    className = ""
}: StatCardProps) {
    const styles = variantStyles[variant];

    const getTrendIcon = (trend: StatTrend) => {
        switch (trend) {
            case 'up':
                return '↗';
            case 'down':
                return '↘';
            default:
                return '→';
        }
    };

    const getTrendColor = (trend: StatTrend) => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className={`bg-[var(--color-panel)] border border-[var(--border-color)]  ${styles.container} rounded-sm p-2.5 sm:p-3 lg:p-4 w-full min-h-[90px] sm:min-h-[100px] lg:min-h-[110px] transition-all duration-200 ${className}`}>
            <div className="flex items-start justify-between h-full gap-2">
                <div className="flex-1 flex flex-col justify-between min-h-0 min-w-0">
                    <div className="min-w-0">
                        <h3 className="text-[10px] sm:text-xs font-medium text-[var(--text-color)] opacity-75 mb-0.5 sm:mb-1 line-clamp-1">
                            {title}
                        </h3>
                        <div className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-panel)] mb-0.5 sm:mb-1 truncate">
                            {(() => {
                                if (typeof value !== 'number') {
                                    return value;
                                }
                                if (value >= 10000) {
                                    return `${(value/1000).toFixed(0)}K`;
                                }
                                return value.toString();
                            })()}
                        </div>
                    </div>
                    {change && (
                        <div className={`flex items-center text-[10px] sm:text-xs ${getTrendColor(change.trend)} mt-auto min-w-0`}>
                            <span className="mr-0.5 sm:mr-1 flex-shrink-0 text-[10px] sm:text-xs">{getTrendIcon(change.trend)}</span>
                            <span className="font-medium truncate">{change.value}</span>
                            <span className="ml-0.5 sm:ml-1 text-[var(--text-color)] opacity-60 hidden sm:inline">{change.period}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg ${styles.accent} flex items-center justify-center flex-shrink-0`}>
                        <div className={`${styles.icon}`}>
                            <Icon name={icon} size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});