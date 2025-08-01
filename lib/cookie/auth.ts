import { authConfig } from "@/constants/auth/client";
import { NextResponse } from "next/server";

export const setRefreshToken = (response: NextResponse, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set("token", refreshToken, {
    ...authConfig.cookieOptions,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  response.cookies.set('auth', 'login', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (response: NextResponse) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // token 쿠키 만료
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // 설정 시와 동일하게 변경
    maxAge: 0,
    expires: new Date(0)
  });
  
  // fp 쿠키 만료
  response.cookies.set('fp', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 0,
    expires: new Date(0)
  });
  
  // auth 쿠키 만료
  response.cookies.set('auth', '', {
    httpOnly: false, // 설정 시와 동일하게 변경
    secure: isProduction,
    sameSite: 'lax', // 설정 시와 동일하게 변경
    maxAge: 0,
    expires: new Date(0)
  });
};
