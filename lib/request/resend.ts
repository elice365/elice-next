import { APIResult } from '@/types/api';
import { NextRequest } from 'next/server';
import { findUser, updateUserAuth } from '@/lib/db/user'; // 변경: prisma 대신 findUser, updateUserAuth 임포트
import { randomUUID } from 'crypto';
import { sendEmail } from '@/utils/email/sendMail';
import { registerEmail } from '@/constants/registerEmail';
import { setMessage } from '../response';

// 이메일 인증 재전송
export const resend = async (request: NextRequest): Promise<APIResult> => {
  try {
    if (request.method !== 'POST') {
      return await setMessage('InvalidType',  null, 405);
    }
    const { email } = await request.json();

    if (!email) {
      return await setMessage('InvalidField',  null, 400);
    }

    // 사용자 조회
    const user = await findUser(email); // 변경: findUser 사용

    if (!user?.auth) {
      return await setMessage('NotFound',  null, 404);
    }

    // 이미 인증된 사용자인지 확인
    if (user.auth.emailVerified) {
      return await setMessage('AuthError',  null, 400);
    }

    // 새로운 인증 토큰 생성
    const emailVerificationToken = randomUUID();
    const emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 토큰 업데이트
    await updateUserAuth(user.id, { // 변경: updateUserAuth 사용
      emailVerificationToken,
      emailVerificationExpires
    });

    // 이메일 인증 URL 생성
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify?token=${emailVerificationToken}`;

    // 이메일 전송
    try {
      const emailContent = await registerEmail(verificationUrl);
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      return await setMessage('emailVerification', null, 200);
    } catch (error) {
      // Log email sending failure for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.error('이메일 전송 실패:', error);
      }
      return await setMessage('UnknownError', null, 500);
    }
  } catch (error) {
    // Log resend error for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.error('Resend verification error:', error);
    }
    return await setMessage('UnknownError', null, 500);
  }
};