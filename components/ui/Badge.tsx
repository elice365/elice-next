"use client";

import { memo } from "react";
import type { BadgeProps } from "@/types/ui";

export const Badge = memo(function Badge({ children, className = "", variant = "default" }: BadgeProps) {
    // Add mobile-optimized class for admin tables
    const mobileClass = className.includes('admin-mobile-badge')
        ? 'admin-mobile-badge' 
        : '';
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${mobileClass} ${className}`}>
            {children}
        </span>
    );
});