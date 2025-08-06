"use client";

import { memo, useCallback, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/auth';
import { useMounted } from "@/hooks/utils";
import { useDropdown } from '@/hooks/ui';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Translated } from "@/components/i18n/Translated";

export default memo(function ProfileDropdown() {
    const mounted = useMounted();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { open, dropdownRef, toggleDropdown, handleKeyDown } = useDropdown();
    const settings = Translated("button", "settings");
    const authLogout = Translated("button", "logout");

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [logout, router]);

    // Handle account settings navigation
    const handleAccountSettings = useCallback(() => {
        router.push('/auth/setting');
    }, [router]);

    // Handle dropdown option selection
    const handleSelect = useCallback((key: string) => {
        switch (key) {
            case 'settings':
                handleAccountSettings();
                break;
            case 'logout':
                handleLogout();
                break;
        }
    }, [handleAccountSettings, handleLogout]);

    // Create dropdown options
    const options = useMemo(() => [
        {
            key: 'settings',
            label: settings,
            icon: 'Settings'
        },
        {
            key: 'logout',
            label: authLogout,
            icon: 'LogOut'
        }
    ], [authLogout, settings]);

    // Don't render if not mounted or not authenticated
    if (!mounted || !isAuthenticated || !user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                aria-label="User profile menu"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls="profile-menu"
                onClick={toggleDropdown}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-2 p-1 w-10 h-10 bg-background border border-[var(--border-color)]  rounded-lg shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
            >
                <Avatar user={user} size="sm" fallbackMode="default-image" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="overflow-hidden absolute mt-2 w-64 bg-background border border-[var(--border-color)]  rounded-lg shadow-xl z-50 top-10 right-0"
                        role="menu"
                        id="profile-menu"
                        aria-label="Profile menu"
                        initial={{ opacity: 0, y: -12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-[var(--border-color)] ">
                            <div className="flex items-center gap-3">
                                <Avatar user={user} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-color)] truncate">
                                        {user.name || user.email}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Options */}
                        {options.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    handleSelect(option.key);
                                    toggleDropdown();
                                }}
                                className="group flex items-center w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                            >
                                {option.icon && (
                                    <Icon
                                        name={option.icon}
                                        className='w-4 h-4 mr-3 text-gray-500 group-hover:text-[var(--text-color)]'
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="text-[var(--text-color)]">{option.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});