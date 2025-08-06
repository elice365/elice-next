'use client';
import { ButtonType } from '@/types/button';
import { memo, useCallback, useMemo } from 'react';
import { useModal } from '@/hooks/modal';
import { usePanel } from '@/hooks/ui';

export const Button = memo(
    ({ type, name, event, className, disabled, children }: ButtonType) => {
        const { auth, setAuth, setForm } = useModal();
        const { panel, setPanel } = usePanel();

        // 불필요한 dispatch와 getActions 함수를 제거하고 actions 객체를 직접 생성합니다.
        // useMemo의 의존성을 명확하게 하여 언제 객체가 재생성되는지 관리합니다.
        const actions = useMemo(
            () => ({
                auth: auth,
                authClose: () => setAuth(false),
                login: () => setForm('login'),
                register: () => setForm('register'),
                panel: panel,
                panelClose: () => setPanel(false),
            }),
            [auth, setAuth, setForm, panel, setPanel]
        );

        const handleClick = useCallback(() => {
            // 'in' 연산자로 더 안전하게 프로퍼티 존재를 확인합니다.
            if (event && event in actions) {
                actions[event as keyof typeof actions]();
            }
        }, [event, actions]);

        return (
            <button
                type={type}
                aria-label={name}
                className={className}
                onClick={handleClick}
                disabled={disabled}
            >
                {children}
            </button>
        );
    }
);


Button.displayName = "Button"