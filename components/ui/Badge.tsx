"use client";

import { memo } from "react";

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export const Badge = memo(function Badge({ children, className = "" }: BadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${className}`}>
            {children}
        </span>
    );
});