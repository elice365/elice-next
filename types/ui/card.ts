// UI Card Component Type Definitions

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