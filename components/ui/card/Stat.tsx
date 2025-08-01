"use client";

import { memo } from "react";
import { Icon } from "../Icon";

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant = 'primary' | 'success' | 'warning' | 'info';

export interface StatCardProps {
    readonly title: string;
    readonly value: string | number;
    readonly change?: {
        readonly value: string;
        readonly trend: StatTrend;
        readonly period: string;
    };
    readonly icon?: string;
    readonly variant?: StatVariant;
    readonly className?: string;
}

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
        <div className={`bg-[var(--color-panel)] border border-[var(--border-color)]  ${styles.container} rounded-lg p-4 w-full min-h-[110px] max-h-[130px] transition-all duration-200 ${className}`}>
            <div className="flex items-start justify-between h-full">
                <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div>
                        <h3 className="text-xs font-medium text-[var(--text-color)] opacity-75 mb-1 line-clamp-1">
                            {title}
                        </h3>
                        <div className="text-xl font-bold text-[var(--text-panel)] mb-1 truncate">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </div>
                    </div>
                    {change && (
                        <div className={`flex items-center text-xs ${getTrendColor(change.trend)} mt-auto`}>
                            <span className="mr-1">{getTrendIcon(change.trend)}</span>
                            <span className="font-medium truncate">{change.value}</span>
                            <span className="ml-1 text-[var(--text-color)] opacity-60 truncate">{change.period}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`w-10 h-10 rounded-lg ${styles.accent} flex items-center justify-center flex-shrink-0 ml-2`}>
                        <div className={`${styles.icon}`}>
                            <Icon name={icon} size={20} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});