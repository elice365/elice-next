"use client"

import Link from "next/link";
import { PanelProps } from "@/types/panel";
import { setDevice } from "@/stores/slice/device";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useCallback, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/stores/hook"
import { SearchInput } from "@/components/features/search/Input";
import { Avatar } from "@/components/ui/Avatar";
import { usePanel } from "@/hooks/usePanel";
import { useModal } from "@/hooks/useModal";
import { useAuth } from "@/hooks/useAuth";
import { useAnimatedWidth } from "@/hooks/useAnimatedWidth"
import { Icon } from "../ui/Icon";
export default memo(function Navigator({ router }: PanelProps) {
    const dispatch = useAppDispatch()
    const { mobile } = useAppSelector((s) => s.device)
    const { setPanel } = usePanel();
    const { setSearch } = useModal();
    const { user, isAuthenticated } = useAuth();
    const panel = useAppSelector((s) => s.panel.panel)

    const resize = useCallback(() => {
        dispatch(setDevice(window.innerWidth))
    }, [dispatch])
    useEffect(() => {
        if (mobile) setPanel(false)
        if (mobile) setSearch(false)
        if (!mobile) setPanel(true)
    }, [mobile, setPanel, setSearch])


    useEffect(() => {
        window.addEventListener("resize", resize)
        resize()
        return () => window.removeEventListener("resize", resize)
    }, [resize])

    const width = useAnimatedWidth(!panel)

    return (
        <AnimatePresence mode="wait">
            {panel && (
                <div style={{ width: mobile ? 0 : `${width}px` }} className="w-[250px]">
                    {/* 모바일에서 배경 오버레이 */}
                    {mobile && (
                        <motion.div
                            className="fixed inset-0 bg-black/20 z-30 top-16"
                            style={{ width: mobile ? 0 : `${width}px` }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setPanel(false)}
                        />
                    )}

                    <motion.aside
                        className={`fixed ${mobile ? 'inset-x-0 top-16' : 'h-[calc(100vh-4rem)]'} z-40 backdrop-blur-sm bg-panel text-[var(--text-panel)] ${!mobile && 'border-r'} border-[var(--border-color)] `}
                        initial={mobile ? { y: "-100%" } : { width: 0 }}
                        animate={mobile ? { y: 0 } : { width: 250 }}

                        exit={mobile ? { y: "-100%" } : { width: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    >

                        <div className="flex h-full flex-col pt-3">
                            <motion.div
                                className="p-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.1, duration: 0.2 }}
                            >
                                <SearchInput />
                            </motion.div>

                            <motion.nav
                                className="bg-panel text-[var(--text-color)] w-full h-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AnimatePresence mode="popLayout">
                                    {router.map((item, index) => (
                                        <motion.div
                                            key={item.path}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{
                                                delay: 0.2 + index * 0.05,
                                                duration: 0.3,
                                                ease: "easeOut"
                                            }}
                                        >
                                            <Link
                                                href={{
                                                    pathname: item.path
                                                }}
                                                className="px-5 py-3 border-b  border-[var(--border-color)]   flex items-center  hover:bg-[var(--hover)] cursor-pointer overflow-hidden"
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, x: mobile ? 0 : -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: mobile ? 0 : 20 }}
                                                    transition={{
                                                        delay: 0.25 + index * 0.05,
                                                        duration: 0.25
                                                    }}
                                                    className="flex items-center gap-3"
                                                >
                                                    {item.icon && (
                                                        <Icon name={item.icon} className="w-4 h-4" />
                                                    )}
                                                    <span className="whitespace-nowrap font-bold">{item.name}</span>
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.nav>
                            {isAuthenticated && user && (
                                <div className="border-y border-[var(--border-color)]  p-2">
                                    <div className="flex items-center space-x-3 ">
                                        <Avatar user={user} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-color)] truncate">
                                                {user.name || user.email.split('@')[0]}
                                            </p>
                                            <p className="text-xs text-[var(--text-color)] truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!isAuthenticated && (
                                <div className="border-y border-[var(--border-color)]  p-2">
                                    <div className="flex items-center space-x-3 ">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                                            ?
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-color)] truncate">
                                                게스트
                                            </p>
                                            <p className="text-xs text-[var(--text-color)] truncate">
                                                로그인이 필요합니다
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
});