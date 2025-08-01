import { APIResult } from "@/types/api";
import { NextRequest } from "next/server";
import { findUserByEmailVerificationToken, updateUserAuth } from "@/lib/db/user"; // 변경: prisma 대신 findUserByEmailVerificationToken, updateUserAuthByUserId 임포트
import { setMessage } from "../response";

// 이메일 인증
export const verify = async (request: NextRequest): Promise<APIResult> => {
  try {

    if (request.method !== 'POST') {
      return await setMessage('InvalidType',  null, 405);
    }
    const { token } = await request.json();

    // 토큰으로 사용자 찾기
    const user = await findUserByEmailVerificationToken(token); // 변경: findUserByEmailVerificationToken 사용

    if (!user?.auth) {
      return await setMessage('InvalidToken',  null, 400);
    }

    // 토큰 만료 확인
    if (user.auth.emailVerificationExpires && user.auth.emailVerificationExpires < new Date()) {
      return await setMessage('TokenExpired',  null, 410);
    }

    // 이메일 인증 완료
    await updateUserAuth(user.auth.id, { // 변경: updateUserAuthByUserId 사용
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    return await setMessage('TokenVerification', null, 403);
  } catch (error) {
    // Log verification error for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.error('Verification error:', error);
    }
    return await setMessage('UnknownError',  null, 500);
  }
};
