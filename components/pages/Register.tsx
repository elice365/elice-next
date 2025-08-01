"use client";

import React, { useEffect } from 'react';
import { AuthForm } from '@/components/features/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  
  // 로그인된 사용자가 회원가입 페이지에 접속하면 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = 'https://a.elice.pro';
    }
  }, [isAuthenticated]);
  
  const handleRegister = async (formData: any) => {
    await register(formData);
  };


  return (
    <AuthForm
      title="register"
      fields={[
        { name: 'email', type: 'email', label: 'Email', autoComplete: 'on' },
        { name: 'password', type: 'password', label: 'Password', autoComplete: 'off' },
        { name: 'confirmPassword', type: 'password', label: 'Confirm Password', autoComplete: 'off', compareValue: 'password', onChange: true },
      ]}
      onSubmit={handleRegister}
      successRedirect="/login"
    />
  );
};
