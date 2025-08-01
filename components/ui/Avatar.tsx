"use client";

import Image from "next/image";
import { memo } from "react";

interface AvatarProps {
    readonly user: {
        readonly imageUrl?: string;
        readonly name?: string;
        readonly email: string;
    };
    readonly size?: "sm" | "md" | "lg";
    readonly className?: string;
    readonly fallbackMode?: 'text' | 'default-image';
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm", 
    lg: "w-12 h-12 text-base"
};

export const Avatar = memo(function Avatar({ 
    user, 
    size = "md", 
    className = "",
    fallbackMode = 'text' 
}: AvatarProps) {
    const sizeClass = sizeClasses[size];
    const fallbackText = (user.name || user.email).charAt(0).toUpperCase();
    
    // Extract nested ternary to separate function
    const getSizeAttribute = (size: string) => {
        if (size === "sm") return "32px";
        if (size === "md") return "40px";
        return "48px";
    };
    
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (fallbackMode === 'text') {
            e.currentTarget.style.display = 'none';
        } else {
            e.currentTarget.src = "https://cdn.elice.pro/images/logo.jpg";
        }
    };
    
    const renderTextFallback = () => {
        return fallbackMode === 'text' ? (
            <span className={user.imageUrl ? 'hidden' : ''}>
                {fallbackText}
            </span>
        ) : null;
    };

    return (
        <div 
            className={`relative rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium ${sizeClass} ${className}`}
        >
            {user.imageUrl ? (
                <Image
                    src={user.imageUrl}
                    alt={user.name || user.email}
                    fill
                    sizes={getSizeAttribute(size)}
                    className="rounded-full object-cover"
                    onError={handleImageError}
                />
            ) : null}
            {renderTextFallback()}
        </div>
    );
});