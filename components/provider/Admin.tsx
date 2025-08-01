"use client";
import { useEffect } from 'react';
import { useAuthData } from './Auth';
import { redirect } from 'next/navigation';


export function AdminProvider({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    const AuthData = useAuthData();

    useEffect(() => {
        // 인증되지 않은 사용자 리다이렉트
        if (!AuthData?.user) {
            redirect('/');
        }

        // admin 권한이 없는 사용자 리다이렉트
        if (!AuthData?.user?.roles?.includes('admin')) {
            redirect('/');
        }
    }, [AuthData]);

    // 권한이 없으면 렌더링하지 않음
    if (!AuthData?.user?.roles?.includes('admin')) {
        return null;
    }
    return (
        <div>
            {children}
        </div>
    );
}